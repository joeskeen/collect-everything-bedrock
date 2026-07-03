import { inject, Lifecycle, scoped } from "tsyringe";
import {
  addOnCommand,
  CommandHandler,
  customCommandParamType as customCommandParamTypes,
  customCommandStatuses,
} from "../../system/add-on-command";
import type { Player, RawMessage, CustomCommandResult, System, CustomCommandOrigin } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME, PlayerCollectionData } from "../collection-constants";
import { GRAY, MINECOIN_GOLD, RESET } from "../../shared/format-codes";
import { capitalCase } from "change-case";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { RegistryCollection } from "../../collections/index";

@scoped(Lifecycle.ContainerScoped)
export class PlayerAllCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(RegistryCollection) private readonly registries: RegistryCollection,
    @inject(PLAYER_TOKEN) private readonly player: Player
  ) {}

  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult {
    const filter = (String(args[0]) || "").toLowerCase();

    this.system.run(() => {
      const collection = this.collection.getCollection();
      const allData = this.registries.registries.map((registry) => ({
        category: registry.key,
        isCollected: (k: string) => {
          const rawId = k.includes(";") ? k.split(";")[1] : k;
          return !!collection[registry.key as keyof PlayerCollectionData]?.[rawId];
        },
        allEntries: () =>
          registry
            .all()
            .sort()
            .filter((e: string) => e.includes(filter)),
        format: (k: string) => registry.format(k),
      }));

      const message: RawMessage = {
        rawtext: [
          { text: `${MINECOIN_GOLD}=== All ${filter ? `"${filter}"` : ""} ===${RESET}\n` },
          ...allData.flatMap((x) => {
            const entries = x.allEntries().map((k: string) => {
              const formatted = x.format(k);
              const color = x.isCollected(k) ? THEME[x.category as keyof typeof THEME] : GRAY;
              return [{ text: color }, { text: formatted }, { text: RESET }, { text: ", " }] as RawMessage[];
            });
            return [
              { text: `${THEME[x.category as keyof typeof THEME] ?? GRAY}${capitalCase(x.category)}${RESET}: ` },
              ...entries.flat(),
              { text: "\n" },
            ];
          }),
          { text: "\n" },
        ],
      };
      this.player.sendMessage(message);
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerAllCommand = addOnCommand({
  name: "all",
  description: "show everything, highlighting collected items",
  handlerClass: PlayerAllCommand,
  optionalParameters: [{ name: "filter", type: customCommandParamTypes.String }],
});