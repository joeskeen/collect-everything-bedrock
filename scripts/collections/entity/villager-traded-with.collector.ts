import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { WORLD_TOKEN } from "../../shared/global-tokens";
import type { World, Entity, ItemStack } from "@minecraft/server";
import { COLLECTOR, Collector } from "../../player/collection-constants";
import { EntityRegistry } from "./entity.registry";
import { filter, map, Observable, share, Subject, Subscription, switchMap, take, takeUntil, tap } from "rxjs";
import { PlayerEvents } from "../../player/player-events";
import { fromBedrockEvent } from "../../shared/rxjs-interop";
import { Vector3Utils } from "@minecraft/math";
import { Logger } from "../../shared/logging/logger";

interface Trade {
  itemsGained: ItemStack[];
  itemsLost: ItemStack[];
  villager: Entity;
}

const villagerEntityIds = ["minecraft:villager_v2", "minecraft:wandering_trader"];
const TRADE_XP_SPAWN_RADIUS = 2;

@scoped(Lifecycle.ContainerScoped)
export class VillagerTradedWithCollector implements Runnable, Disposable {
  private readonly afterPlayerTradeWithVillager$: Observable<Trade>;
  private subscription: Subscription | undefined = undefined;

  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry,
    @inject(PlayerEvents) private readonly playerEvents: PlayerEvents
  ) {
    const startTradingSession$ = this.playerEvents.afterPlayerOpensEntityContainer$.pipe(
      filter((e) => villagerEntityIds.includes(e.entity.typeId)),
      tap(() => this.logger.debug("trade session opened"))
    );

    this.afterPlayerTradeWithVillager$ = startTradingSession$.pipe(
      switchMap((openEvent) => {
        const villager = openEvent.entity;
        const trade$ = new Subject<Trade>();

        const closeTradingSession$ = this.playerEvents.afterPlayerClosesEntityContainer$.pipe(
          filter((e) => e.entity.id === villager.id),
          take(1),
          tap(() => this.logger.debug("trade session closed")),
          share()
        );

        const lostItem$ = this.playerEvents.afterPlayerInventoryItemChange$.pipe(
          takeUntil(closeTradingSession$),
          filter((e) => !e.itemStack),
          map((e) => e.beforeItemStack as ItemStack),
          filter((e) => !!e),
          tap((e) => this.logger.debug("player consumed item(s)", e.amount, e.typeId))
        );

        const gainedItem$ = this.playerEvents.afterPlayerInventoryItemChange$.pipe(
          takeUntil(closeTradingSession$),
          filter((e) => !e.beforeItemStack),
          map((e) => e.itemStack as ItemStack),
          filter((e) => !!e),
          tap((e) => this.logger.debug("player gained item(s)", e.amount, e.typeId))
        );

        const xpSpawned$ = fromBedrockEvent(this.world.afterEvents.entitySpawn).pipe(
          takeUntil(closeTradingSession$),
          filter(
            (e) =>
              e.entity.typeId === "minecraft:xp_orb" &&
              Vector3Utils.distance(e.entity.location, villager.location) < TRADE_XP_SPAWN_RADIUS
          ),
          tap((e) => this.logger.debug("xp spawned", e.entity.typeId))
        );

        interface TradeProgress {
          lostItems: ItemStack[] | undefined;
          gainedItems: ItemStack[] | undefined;
          xpSpawned: boolean;
        }

        const noTradeProgress = (): TradeProgress => ({
          gainedItems: undefined,
          lostItems: undefined,
          xpSpawned: false,
        });

        let tradeProgress = noTradeProgress();

        const checkProgress = () => {
          this.logger.debug(
            JSON.stringify({
              lostItems: tradeProgress.lostItems?.map((i) => `${i.amount} ${i.typeId}`),
              gainedItems: tradeProgress.gainedItems?.map((i) => `${i.amount} ${i.typeId}`),
              xpSpawned: tradeProgress.xpSpawned,
            })
          );
          if (tradeProgress.gainedItems && tradeProgress.lostItems && tradeProgress.xpSpawned) {
            trade$.next({
              itemsGained: tradeProgress.gainedItems,
              itemsLost: tradeProgress.lostItems,
              villager: openEvent.entity,
            });
            tradeProgress = noTradeProgress();
          }
        };

        lostItem$.subscribe((e) => {
          tradeProgress.lostItems = tradeProgress.lostItems ?? [];
          tradeProgress.lostItems.push(e);
          checkProgress();
        });

        gainedItem$.subscribe((e) => {
          tradeProgress.gainedItems = tradeProgress.gainedItems ?? [];
          tradeProgress.gainedItems.push(e);
          checkProgress();
        });

        xpSpawned$.subscribe(() => {
          tradeProgress.xpSpawned = true;
          checkProgress();
        });

        return trade$.pipe(takeUntil(closeTradingSession$));
      })
    );
  }

  run() {
    this.subscription = this.afterPlayerTradeWithVillager$.subscribe(this.afterTrade);
  }

  dispose() {
    this.subscription?.unsubscribe();
  }

  readonly afterTrade = (trade: Trade) => {
    const ids = this.entityRegistry.identify(trade.villager);
    ids.forEach((id) => this.collector.collect(id));
  };
}
