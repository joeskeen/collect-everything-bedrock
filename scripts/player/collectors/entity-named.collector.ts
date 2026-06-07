import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, SYSTEM_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import type { Player, PlayerInteractWithEntityAfterEvent, System, World } from "@minecraft/server";
import { COLLECTOR, Collector, ENTITY } from "../collection-constants";
import { identifyEntity } from "../../data/entities";
import { Logger } from "../../shared/logging/logger";

@scoped(Lifecycle.ContainerScoped)
export class EntityNamedCollector implements Runnable, Disposable {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(Logger) private readonly logger: Logger
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

    if (
      event.beforeItemStack?.typeId === "minecraft:name_tag" &&
      event.itemStack?.amount === event.beforeItemStack?.amount - 1
    ) {
      const [entityId, entityDisplayName] = identifyEntity(event.target);
      this.collector.collect(ENTITY, entityId, entityDisplayName);
    }
  };
}
