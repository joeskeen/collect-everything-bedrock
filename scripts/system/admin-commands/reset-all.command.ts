import { inject, singleton } from "tsyringe";
import { addOnCommand, CommandHandler, commandPermissionLevels, customCommandStatuses } from "../add-on-command";
import { PlayerManager } from "../player-manager";
import { Logger } from "../../shared/logging/logger";
import { CustomCommandResult } from "@minecraft/server";

@singleton()
export class ResetAllCommandHandler implements CommandHandler {
  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(PlayerManager) private readonly playerManager: PlayerManager
  ) {}

  handleCommand(_event: any): CustomCommandResult {
    this.logger.log("BOOM");
    // TODO: actually implement this
    return { status: customCommandStatuses.Success };
  }
}

export const resetAllCommand = addOnCommand({
  name: "_reset_all",
  description: "resets the collection progress of ALL players",
  permissionLevel: commandPermissionLevels.GameDirectors,
  handlerClass: ResetAllCommandHandler,
});
