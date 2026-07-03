import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult, Player, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME, PlayerCollectionData } from "../collection-constants";
import { capitalCase, percent } from "../../shared/formatting";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { RegistryCollection } from "../../collections/index";
import { PlayerSettingsService } from "../player-settings";

@scoped(Lifecycle.ContainerScoped)
export class PlayerStatsCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(RegistryCollection) private readonly registries: RegistryCollection,
    @inject(PlayerSettingsService) private readonly playerSettingsService: PlayerSettingsService
  ) {}

  handleCommand(event: any): CustomCommandResult {
    this.system.run(() => {
      const difficulty = this.playerSettingsService.get().difficulty;

      const collectionProgress = this.registries.registries
        .filter((r) => r.key !== "all")
        .map((registry) => {
          const collection = this.collection.getCollection(registry.key as keyof PlayerCollectionData);
          return {
            category: registry.key,
            ...registry.count(Object.keys(collection ?? {}), difficulty),
          };
        });

      const totalProgress = {
        collected: collectionProgress.reduce((prev, curr) => prev + curr.collected, 0),
        total: collectionProgress.reduce((prev, curr) => prev + curr.total, 0),
      };
      const messageLines = [
        `${GOLD}=== Collection Stats ===${GRAY}`,
        collectionProgress
          .map(
            (c) =>
              `${THEME[c.category as keyof typeof THEME] ?? GRAY}${capitalCase(c.category)}${RESET}: ${c.collected}/${c.total || "?"} (${percent(c.collected, c.total)}) ${c.extra ? "+" + c.extra : ""}`
          )
          .join("\n"),
        `${GOLD}Total: ${totalProgress.collected}/${totalProgress.total} (${percent(totalProgress.collected, totalProgress.total)})\n`,
      ];
      this.player.sendMessage(messageLines.join("\n"));
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerStatsCommand = addOnCommand({
  name: "stats",
  description: "show collection statistics",
  handlerClass: PlayerStatsCommand,
});
