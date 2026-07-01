import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult, System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../../shared/global-tokens";
import { SettingsModal } from "../modals/settings.modal";

export type SettingsFormResponses = [number];

@scoped(Lifecycle.ContainerScoped)
export class PlayerSettingsCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(SettingsModal) private readonly settingsModal: SettingsModal
  ) {}

  handleCommand(): CustomCommandResult {
    this.system.run(() => {
      this.settingsModal.show();
    });

    return { status: customCommandStatuses.Success };
  }
}

export const playerSettingsCommand = addOnCommand({
  name: "settings",
  description: "configure collection preferences",
  handlerClass: PlayerSettingsCommand,
});
