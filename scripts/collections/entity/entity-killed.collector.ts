import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import type { EntityDieAfterEvent, Player, World } from "@minecraft/server";
import { COLLECTOR, Collector, ENTITY } from "../../player/collection-constants";
import { EntityRegistry } from "./entity.registry";

@scoped(Lifecycle.ContainerScoped)
export class EntityKilledCollector implements Runnable, Disposable {
  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry
  ) {}

  run() {
    this.world.afterEvents.entityDie.subscribe(this.onEntityDeath);
  }

  dispose() {
    this.world.afterEvents.entityDie.unsubscribe(this.onEntityDeath);
  }

  readonly onEntityDeath = (event: EntityDieAfterEvent) => {
    const damageSource = event.damageSource;
    if (!damageSource) return;

    const damagingEntity = damageSource.damagingEntity;
    if (!damagingEntity || damagingEntity.id !== this.player.id) return;

    const ids = this.entityRegistry.identify(event.deadEntity);
    ids.forEach((id: string) => {
      this.collector.collect(id);
    });
  };
}
