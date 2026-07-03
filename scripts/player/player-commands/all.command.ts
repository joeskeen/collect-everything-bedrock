import { inject, Lifecycle, scoped } from "tsyringe";
import {
  addOnCommand,
  CommandHandler,
  customCommandParamType as customCommandParamTypes,
  customCommandStatuses,
} from "../../system/add-on-command";
import type { Player, CustomCommandResult, System, CustomCommandOrigin } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME, PlayerCollectionData } from "../collection-constants";
import { GRAY, MINECOIN_GOLD, RESET } from "../../shared/format-codes";
import { capitalCase } from "../../shared/formatting";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { RegistryCollection } from "../../collections/index";
import { PlayerSettingsService } from "../player-settings";

@scoped(Lifecycle.ContainerScoped)
export class PlayerAllCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(RegistryCollection) private readonly registries: RegistryCollection,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerSettingsService) private readonly playerSettingsService: PlayerSettingsService
  ) {}

  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult {
    const filter = (String(args[0]) || "").toLowerCase();

    this.system.run(() => {
      const difficulty = this.playerSettingsService.get().difficulty;

      this.player.sendMessage(`${MINECOIN_GOLD}=== All ${filter ? `"${filter}"` : ""} ===`);

      for (const registry of this.registries.registries.filter((r) => r.key !== "all")) {
        const collection = this.collection.getCollection(registry.key as keyof PlayerCollectionData);
        const entries = registry
          .all(difficulty)
          .filter(({ id }) => id.includes(filter))
          .map(({ id, displayName }) => {
            const rawId = id.includes(";") ? id.split(";")[1] : id;
            const color = collection?.[rawId] ? (THEME[registry.key as keyof typeof THEME] ?? "") : GRAY;
            return `${color}${displayName}${RESET}`;
          });

        if (entries.length > 0) {
          const categoryColor = THEME[registry.key as keyof typeof THEME] ?? GRAY;
          this.player.sendMessage(`${categoryColor}${capitalCase(registry.key)}${RESET}: ${entries.join(", ")}`);
        }
      }
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
