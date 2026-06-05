import type { System, World } from "@minecraft/server";
import { inject, singleton } from "tsyringe";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "./global-tokens";

@singleton()
export class CollectEverythingAddOn {
  constructor(
    @inject(WORLD_TOKEN) private world: World,
    @inject(SYSTEM_TOKEN) private system: System
  ) {}

  run() {
    console.log("Hello, world! This is the Collect Everything Add-On for Bedrock Edition.");
    console.log(
      `Current players: ${this.world
        .getPlayers()
        .map((player) => player.name)
        .join(", ")}`
    );
    console.log(`Current system tick: ${this.system.currentTick}`);
  }
}
