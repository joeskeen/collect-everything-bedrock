import { inject, singleton } from "tsyringe";
import { PlayerManager } from "./player-manager";
import { CommandManager } from "./command-manager";
import type { StartupEvent } from "@minecraft/server";

@singleton()
export class CollectEverythingAddOn {
  constructor(
    @inject(PlayerManager) private playerManager: PlayerManager,
    @inject(CommandManager) private commandManager: CommandManager
  ) {}

  startUp(event: StartupEvent) {
    this.commandManager.onStartUp(event);
  }

  run() {
    this.playerManager.run();
  }
}
