import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult, System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../../shared/global-tokens";
import { SessionModal } from "../modals/session.modal";

@scoped(Lifecycle.ContainerScoped)
export class PlayerSessionCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(SessionModal) private readonly sessionModal: SessionModal
  ) {}

  handleCommand(): CustomCommandResult {
    this.system.run(async () => {
      await this.sessionModal.show();
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerSessionCommand = addOnCommand({
  name: "session",
  description: "show what you have collected this session",
  handlerClass: PlayerSessionCommand,
});
