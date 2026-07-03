import { container, inject, singleton } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { WORLD_TOKEN } from "../../shared/global-tokens";
import type { EntityDieAfterEvent, World } from "@minecraft/server";
import { ENTITY } from "../../player/collection-constants";

@singleton()
export class EnderDragonCollector implements Runnable {
  private _isInitialized = false;

  constructor(@inject(WORLD_TOKEN) private readonly world: World) {}

  run() {
    if (this._isInitialized) {
      return;
    }

    this.world.afterEvents.entityDie.subscribe(this.onEntityDeath);
    this._isInitialized = true;
  }

  readonly onEntityDeath = async (event: EntityDieAfterEvent) => {
    if (event.deadEntity.typeId !== "minecraft:ender_dragon") return;

    const helpers = this.world.getDimension(event.deadEntity.dimension.id).getPlayers({
      location: event.deadEntity.location,
      maxDistance: 100,
    });

    // to avoid circular dependency we dynamically import these only when needed
    const PlayerManager = (await import("../../system/player-manager")).PlayerManager;
    const PlayerCollection = (await import("../../player/player-collection")).PlayerCollection;
    const playerManager = container.resolve(PlayerManager);
    for (const helper of helpers) {
      const playerContainer = playerManager.getPlayerContainer(helper.name);
      if (!playerContainer) {
        continue;
      }

      playerContainer.resolve(PlayerCollection).onCollect(`${ENTITY};${event.deadEntity.typeId}`);
    }
  };
}
