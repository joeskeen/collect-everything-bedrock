import { Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import { CustomCommandResult } from "@minecraft/server";

@scoped(Lifecycle.ContainerScoped)
export class PlayerStatsCommand implements CommandHandler {
  handleCommand(event: any): CustomCommandResult {
    return { message: "yay", status: customCommandStatuses.Success };
  }
}

export const playerStatsCommand = addOnCommand({
  name: "stats",
  description: "show collection statistics",
  handlerClass: PlayerStatsCommand,
});
