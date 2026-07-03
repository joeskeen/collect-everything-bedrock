import { inject, singleton } from "tsyringe";
import type { CustomCommandOrigin, CustomCommandResult, Entity, Player, System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DebugSettingsModal } from "../../player/modals/debug-settings.modal";
import { addOnCommand, CommandHandler, commandPermissionLevels, customCommandStatuses } from "../add-on-command";

function isPlayer(entity?: Entity): entity is Player {
  return !!entity && "commandPermissionLevel" in entity && "inputInfo" in entity;
}

@singleton()
export class DebugSettingsCommandHandler implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(DebugSettingsModal) private readonly debugSettingsModal: DebugSettingsModal
  ) {}

  handleCommand(origin: CustomCommandOrigin): CustomCommandResult {
    const player = origin.sourceEntity;
    if (!isPlayer(player)) {
      return { status: customCommandStatuses.Failure, message: "only players can use this command" };
    }

    this.system.run(() => {
      this.debugSettingsModal.show(player);
    });
    return { status: customCommandStatuses.Success };
  }
}

export const debugSettingsCommand = addOnCommand({
  name: "__debug_settings",
  description: "opens the debug log settings panel",
  permissionLevel: commandPermissionLevels.GameDirectors,
  handlerClass: DebugSettingsCommandHandler,
});
