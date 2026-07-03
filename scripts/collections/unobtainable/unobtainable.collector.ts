import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import type { PlayerBreakBlockAfterEvent, Player, World } from "@minecraft/server";
import { COLLECTOR, Collector, UNOBTAINABLE } from "../../player/collection-constants";
import { UnobtainableRegistry } from "./unobtainable.registry";

@scoped(Lifecycle.ContainerScoped)
export class UnobtainableCollector implements Runnable, Disposable {
  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(UnobtainableRegistry) private readonly unobtainableRegistry: UnobtainableRegistry
  ) {}

  run() {
    this.world.afterEvents.playerBreakBlock.subscribe(this.onPlayerBreakBlock);
  }

  dispose() {
    this.world.afterEvents.playerBreakBlock.unsubscribe(this.onPlayerBreakBlock);
  }

  private readonly onPlayerBreakBlock = (event: PlayerBreakBlockAfterEvent) => {
    if (event.player.id !== this.player.id) return;

    const blockId = event.brokenBlockPermutation.type.id;
    if (this.unobtainableRegistry.isUnobtainable(blockId)) {
      const prefixedId = this.unobtainableRegistry.identify(blockId)[0];
      this.collector.collect(prefixedId);
    }
  };
}
