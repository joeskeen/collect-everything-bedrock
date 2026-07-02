import { inject, singleton } from "tsyringe";
import { PlayerManager } from "./player-manager";
import { CommandManager } from "./command-manager";
import type { StartupEvent } from "@minecraft/server";
import { CollectionChecklistItemDefinition } from "../items/collection-checklist";

@singleton()
export class CollectEverythingAddOn {
  constructor(
    @inject(PlayerManager) private playerManager: PlayerManager,
    @inject(CommandManager) private commandManager: CommandManager,
    @inject(CollectionChecklistItemDefinition) private checklistItem: CollectionChecklistItemDefinition
  ) {}

  startUp(event: StartupEvent) {
    this.commandManager.onStartUp(event);
    this.checklistItem.init();
  }

  run() {
    this.playerManager.run();
  }
}
