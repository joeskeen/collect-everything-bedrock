import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { ENTITY_COMPONENT_TYPES_TOKEN, PLAYER_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import {
  EntityComponentTypes,
  type Player,
  type PlayerInteractWithEntityAfterEvent,
  type World,
} from "@minecraft/server";
import { COLLECTOR, Collector, ENTITY } from "../../player/collection-constants";
import { EntityRegistry } from "./entity.registry";

@scoped(Lifecycle.ContainerScoped)
export class EntityTamedCollector implements Runnable, Disposable {
  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry,
    @inject(ENTITY_COMPONENT_TYPES_TOKEN) private readonly entityComponentTypes: typeof EntityComponentTypes
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

    if (event.target.getComponent(this.entityComponentTypes.IsTamed)) {
      const ids = this.entityRegistry.identify(event.target);
      ids.forEach((id: string) => {
        this.collector.collect(id);
      });
    }
  };
}
