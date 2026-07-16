import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import type { World } from "@minecraft/server";
import { COLLECTOR, Collector } from "../../player/collection-constants";
import { DeathRegistry } from "./death.registry";
import { PlayerEvents } from "../../player/player-events";
import { Observable, Subscription, filter, map, merge, race, switchMap, timer } from "rxjs";
import { WORLD_TOKEN } from "../../shared/global-tokens";
import { fromBedrockEvent } from "../../shared/rxjs-interop";

const HIT_WINDOW_MS = 3 * 1000;

@scoped(Lifecycle.ContainerScoped)
export class DeathCollector implements Runnable, Disposable {
  private subscription: Subscription | undefined = undefined;
  private readonly death$: Observable<string>;

  constructor(
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(DeathRegistry) private readonly deathRegistry: DeathRegistry,
    @inject(PlayerEvents) private readonly playerEvents: PlayerEvents,
    @inject(WORLD_TOKEN) world: World
  ) {
    this.death$ = merge(
      this.playerEvents.afterPlayerDie$,
      this.playerEvents.afterPlayerHitEntity$.pipe(
        switchMap((hitEvent) =>
          race([
            timer(HIT_WINDOW_MS).pipe(map(() => null)),
            fromBedrockEvent(world.afterEvents.entityDie).pipe(
              filter((e) => e.deadEntity.id === hitEvent.hitEntity.id)
            ),
          ]).pipe(filter((x) => !!x))
        )
      )
    ).pipe(map((e) => e.damageSource.cause));
  }

  run() {
    this.subscription = this.death$.subscribe(this.onDeath);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }

  readonly onDeath = (cause: string) => {
    const ids = this.deathRegistry.identify(cause);
    ids.forEach((id) => this.collector.collect(id));
  };
}
