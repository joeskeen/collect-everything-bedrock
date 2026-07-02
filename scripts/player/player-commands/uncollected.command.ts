import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, RawMessage, CustomCommandResult, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME, PlayerCollectionData } from "../collection-constants";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { capitalCase } from "change-case";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { RegistryCollection } from "../../collections/index";

@scoped(Lifecycle.ContainerScoped)
export class PlayerUncollectedCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(RegistryCollection) private readonly registries: RegistryCollection,
    @inject(PLAYER_TOKEN) private readonly player: Player
  ) {}

  handleCommand(event: any): CustomCommandResult {
    this.system.run(() => {
      const collection = this.collection.getCollection();
      const uncollectedData: Array<{ category: string; entries: string[] }> = [];

      for (const registry of this.registries.registries) {
        const entries = registry
          .all()
          .filter((k: string) => !collection[registry.key as keyof PlayerCollectionData]?.[k])
          .sort()
          .map((k: string) => registry.format(k));
        
        if (entries.length > 0) {
          uncollectedData.push({ category: registry.key, entries });
        }
      }

      const message: RawMessage = {
        rawtext: [
          { text: `${GOLD}=== Uncollected ===${GRAY}\n` },
          ...uncollectedData.flatMap((x) => [
            { text: `${THEME[x.category as keyof typeof THEME] ?? GRAY}${capitalCase(x.category)}${RESET}: ` },
            ...x.entries.flatMap((e) => [{ text: e }, { text: ", " }]),
            { text: "\n" },
          ]),
          { text: "\n" },
        ],
      };
      this.player.sendMessage(message);
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerUncollectedCommand = addOnCommand({
  name: "uncollected",
  description: "show what you have not yet collected",
  handlerClass: PlayerUncollectedCommand,
});