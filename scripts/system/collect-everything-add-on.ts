import { inject, singleton } from "tsyringe";
import { PlayerManager } from "./player-manager";
import { CommandManager } from "./command-manager";
import type { StartupEvent } from "@minecraft/server";
import { CollectionChecklistItem } from "../items/collection-checklist.item";

@singleton()
export class CollectEverythingAddOn {
  constructor(
    @inject(PlayerManager) private playerManager: PlayerManager,
    @inject(CommandManager) private commandManager: CommandManager,
    @inject(CollectionChecklistItem) private checklistItem: CollectionChecklistItem
  ) {}

  startUp(event: StartupEvent) {
    this.commandManager.onStartUp(event);
    this.checklistItem.init();
  }

  run() {
    this.playerManager.run();
  }
}
