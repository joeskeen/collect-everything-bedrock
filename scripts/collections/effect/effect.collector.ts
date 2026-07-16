import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import type { EffectAddAfterEvent } from "@minecraft/server";
import { COLLECTOR, Collector } from "../../player/collection-constants";
import { EffectRegistry } from "./effect.registry";
import { PlayerEvents } from "../../player/player-events";
import { Subscription } from "rxjs";

@scoped(Lifecycle.ContainerScoped)
export class EffectCollector implements Runnable, Disposable {
  private readonly afterPlayerEffectAdd$ = this.playerEvents.afterPlayerEffectAdd$;
  private subscription: Subscription | undefined = undefined;

  constructor(
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(EffectRegistry) private readonly effectRegistry: EffectRegistry,
    @inject(PlayerEvents) private readonly playerEvents: PlayerEvents
  ) {}

  run() {
    this.subscription = this.afterPlayerEffectAdd$.subscribe(this.onEffectAdded);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }

  private readonly onEffectAdded = (e: EffectAddAfterEvent) => {
    const ids = this.effectRegistry.identify(e.effect);
    ids.forEach((id) => this.collector.collect(id));
  };
}
