import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, CustomCommandResult, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME, PlayerCollectionData } from "../collection-constants";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { capitalCase } from "../../shared/formatting";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { RegistryCollection } from "../../collections/index";
import { PlayerSettingsService } from "../player-settings";

@scoped(Lifecycle.ContainerScoped)
export class PlayerCollectedCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(RegistryCollection) private readonly registries: RegistryCollection,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerSettingsService) private readonly playerSettingsService: PlayerSettingsService
  ) {}

  handleCommand(event: any): CustomCommandResult {
    this.system.run(() => {
      const difficulty = this.playerSettingsService.get().difficulty;

      this.player.sendMessage(`${GOLD}=== Collected ===`);

      for (const registry of this.registries.registries.filter((r) => r.key !== "all")) {
        const collection = this.collection.getCollection(registry.key as keyof PlayerCollectionData);
        const entries = registry
          .all(difficulty)
          .filter(({ id }) => {
            const rawId = id.includes(";") ? id.split(";")[1] : id;
            return !!collection?.[rawId];
          })
          .map(({ displayName }) => displayName);

        if (entries.length > 0) {
          const categoryColor = THEME[registry.key as keyof typeof THEME] ?? GRAY;
          this.player.sendMessage(`${categoryColor}${capitalCase(registry.key)}${RESET}: ${entries.join(", ")}`);
        }
      }
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerCollectedCommand = addOnCommand({
  name: "collected",
  description: "show what you have collected",
  handlerClass: PlayerCollectedCommand,
});
