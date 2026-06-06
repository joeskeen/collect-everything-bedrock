import { inject, Lifecycle, scoped } from "tsyringe";
import { PLAYER_TOKEN } from "../global-tokens";
import type { Player } from "@minecraft/server";

@scoped(Lifecycle.ContainerScoped)
export class PlayerCollection {
  constructor(@inject(PLAYER_TOKEN) private player: Player) {}
  run() {
    console.log(`Initializing collection for player ${this.player.name}`);
  }
}
