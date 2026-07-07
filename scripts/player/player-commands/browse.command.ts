import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult, System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../../shared/global-tokens";
import { BrowserModal } from "../modals/collection-browser/browser.modal";

@scoped(Lifecycle.ContainerScoped)
export class PlayerBrowseCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(BrowserModal) private readonly browserModal: BrowserModal
  ) {}

  handleCommand(): CustomCommandResult {
    this.system.run(() => this.browserModal.show());
    return { status: customCommandStatuses.Success };
  }
}

export const playerBrowseCommand = addOnCommand({
  name: "browse",
  description: "browse your collection",
  handlerClass: PlayerBrowseCommand,
});
