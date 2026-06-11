import { inject, singleton } from "tsyringe";
import { addOnCommand, CommandHandler, commandPermissionLevels, customCommandStatuses } from "../add-on-command";
import { PlayerManager } from "../player-manager";
import { Logger } from "../../shared/logging/logger";
import type { CustomCommandResult, System, World } from "@minecraft/server";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import { PlayerCollection } from "../../player/player-collection";
import { CollectionScoreboard } from "../scoreboard";

@singleton()
export class ResetAllCommandHandler implements CommandHandler {
  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PlayerManager) private readonly playerManager: PlayerManager,
    @inject(CollectionScoreboard) private readonly collectionScoreboard: CollectionScoreboard
  ) {}

  handleCommand(_event: any): CustomCommandResult {
    this.system.run(() => {
      const players = this.world.getPlayers();
      players.forEach((p) => {
        const playerContainer = this.playerManager.getPlayerContainer(p.name);
        if (!playerContainer) {
          return;
        }

        const playerCollection = playerContainer.resolve(PlayerCollection);
        playerCollection.delete();
      });
      this.collectionScoreboard.reset();
    });
    return { status: customCommandStatuses.Success };
  }
}

export const resetAllCommand = addOnCommand({
  name: "_reset_all",
  description: "resets the collection progress of ALL players",
  permissionLevel: commandPermissionLevels.GameDirectors,
  handlerClass: ResetAllCommandHandler,
});
