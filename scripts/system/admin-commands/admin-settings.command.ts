import { inject, singleton } from "tsyringe";
import type { CustomCommandOrigin, CustomCommandResult, Entity, Player, System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../../shared/global-tokens";
import { AdminSettingsModal } from "../../player/modals/admin-settings.modal";
import { addOnCommand, CommandHandler, commandPermissionLevels, customCommandStatuses } from "../add-on-command";

function isPlayer(entity?: Entity): entity is Player {
  return !!entity && "commandPermissionLevel" in entity && "inputInfo" in entity;
}

@singleton()
export class AdminSettingsCommandHandler implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(AdminSettingsModal) private readonly adminSettingsModal: AdminSettingsModal
  ) {}

  handleCommand(origin: CustomCommandOrigin): CustomCommandResult {
    const player = origin.sourceEntity;
    if (!isPlayer(player)) {
      return { status: customCommandStatuses.Failure, message: "only players can use this command" };
    }

    this.system.run(() => {
      this.adminSettingsModal.show(player);
    });
    return { status: customCommandStatuses.Success };
  }
}

export const adminSettingsCommand = addOnCommand({
  name: "_admin_settings",
  description: "opens the admin log settings panel",
  permissionLevel: commandPermissionLevels.GameDirectors,
  handlerClass: AdminSettingsCommandHandler,
});
