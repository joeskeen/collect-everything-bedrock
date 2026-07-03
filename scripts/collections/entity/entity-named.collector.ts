import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import type { Player, PlayerInteractWithEntityAfterEvent, World } from "@minecraft/server";
import { COLLECTOR, Collector, ENTITY } from "../../player/collection-constants";
import { EntityRegistry } from "./entity.registry";

@scoped(Lifecycle.ContainerScoped)
export class EntityNamedCollector implements Runnable, Disposable {
  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry
  ) {}

  run() {
    this.world.afterEvents.playerInteractWithEntity.subscribe(this.onPlayerInteractWithEntity);
  }

  dispose() {
    this.world.afterEvents.playerInteractWithEntity.unsubscribe(this.onPlayerInteractWithEntity);
  }

  readonly onPlayerInteractWithEntity = (event: PlayerInteractWithEntityAfterEvent) => {
    if (event.player.id !== this.player.id) {
      return;
    }

    if (event.beforeItemStack?.typeId === "minecraft:name_tag") {
      const ids = this.entityRegistry.identify(event.target);
      ids.forEach((id: string) => {
        this.collector.collect(id);
      });
    }
  };
}
