import type { Player, System, World } from "@minecraft/server";
import { autoInjectable, inject, singleton } from "tsyringe";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "../shared/global-tokens";
import { PlayerManager } from "./player-manager";

@singleton()
export class CollectEverythingAddOn {
  constructor(
    @inject(WORLD_TOKEN) private world: World,
    @inject(SYSTEM_TOKEN) private system: System,
    @inject(PlayerManager) private playerManager: PlayerManager
  ) {}

  run() {
    this.playerManager.run();
  }
}
