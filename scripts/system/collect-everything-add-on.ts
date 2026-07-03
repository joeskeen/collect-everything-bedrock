import { inject, singleton } from "tsyringe";
import { PlayerManager } from "./player-manager";
import { CommandManager } from "./command-manager";
import type { StartupEvent } from "@minecraft/server";
import { CollectionChecklistItem } from "../items/collection-checklist.item";
import { WorldStorage } from "../shared/storage";
import { setLogSettings, LOG_SETTINGS_STORAGE_KEY } from "../shared/logging/log-settings";

@singleton()
export class CollectEverythingAddOn {
  constructor(
    @inject(PlayerManager) private playerManager: PlayerManager,
    @inject(CommandManager) private commandManager: CommandManager,
    @inject(CollectionChecklistItem) private checklistItem: CollectionChecklistItem,
    @inject(WorldStorage) private readonly worldStorage: WorldStorage
  ) {}

  startUp(event: StartupEvent) {
    this.commandManager.onStartUp(event);
    this.checklistItem.onStartUp(event);
  }

  run() {
    const stored = this.worldStorage.get<{
      levels: ("log" | "warn" | "error")[];
      logToConsole: boolean;
      logToChat: boolean;
    }>(LOG_SETTINGS_STORAGE_KEY);
    if (stored) {
      setLogSettings(stored);
    }
    this.playerManager.run();
  }
}
