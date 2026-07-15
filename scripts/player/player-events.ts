import type { Entity, Player, World } from "@minecraft/server";
import { inject, Lifecycle, scoped } from "tsyringe";
import { PLAYER_TOKEN, WORLD_TOKEN } from "../shared/global-tokens";
import { fromBedrockEvent } from "../shared/rxjs-interop";
import { filter } from "rxjs";

@scoped(Lifecycle.ContainerScoped)
export class PlayerEvents {
  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player
  ) {}

  private onlyWhenCurrentPlayerIs<TEvent>(playerSelector: (event: TEvent) => Player | Entity | undefined) {
    return filter((event: TEvent) => playerSelector(event) === this.player);
  }

  private onlyWhenCurrentPlayerNameIs<TEvent>(playerNameSelector: (event: TEvent) => string) {
    return filter((event: TEvent) => playerNameSelector(event) === this.player.name);
  }

  private onlyWhenCurrentPlayer<T extends { player?: Player }>() {
    return this.onlyWhenCurrentPlayerIs((event: T) => event.player);
  }

  readonly afterPlayerJoin$ = fromBedrockEvent(this.world.afterEvents.playerJoin).pipe(
    this.onlyWhenCurrentPlayerNameIs((event) => event.playerName)
  );

  readonly afterPlayerLeave$ = fromBedrockEvent(this.world.afterEvents.playerLeave).pipe(
    this.onlyWhenCurrentPlayerNameIs((event) => event.playerName)
  );

  readonly afterPlayerKilledEntity$ = fromBedrockEvent(this.world.afterEvents.entityDie).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.damageSource.damagingEntity)
  );

  readonly afterPlayerHitBlock$ = fromBedrockEvent(this.world.afterEvents.entityHitBlock).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.damagingEntity)
  );

  readonly afterPlayerHitEntity$ = fromBedrockEvent(this.world.afterEvents.entityHitEntity).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.damagingEntity)
  );

  readonly afterPlayerHurtEntity$ = fromBedrockEvent(this.world.afterEvents.entityHurt).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.damageSource?.damagingEntity)
  );

  readonly afterPlayerInventoryItemChange$ = fromBedrockEvent(this.world.afterEvents.playerInventoryItemChange).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerEntityItemPickup$ = fromBedrockEvent(this.world.afterEvents.entityItemPickup).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.entity)
  );

  readonly afterPlayerOpensEntityContainer$ = fromBedrockEvent(this.world.afterEvents.entityContainerOpened).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.openSource.entity)
  );

  readonly afterPlayerClosesEntityContainer$ = fromBedrockEvent(this.world.afterEvents.entityContainerClosed).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.closeSource.entity)
  );

  readonly afterPlayerOpensBlockContainer$ = fromBedrockEvent(this.world.afterEvents.blockContainerOpened).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.openSource.entity)
  );

  readonly afterPlayerClosesBlockContainer$ = fromBedrockEvent(this.world.afterEvents.blockContainerClosed).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.closeSource.entity)
  );

  readonly afterPlayerBreakBlock$ = fromBedrockEvent(this.world.afterEvents.playerBreakBlock).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerInteractWithBlock$ = fromBedrockEvent(this.world.afterEvents.playerInteractWithBlock).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerInteractWithEntity$ = fromBedrockEvent(this.world.afterEvents.playerInteractWithEntity).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerPlaceBlock$ = fromBedrockEvent(this.world.afterEvents.playerPlaceBlock).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerSpawn$ = fromBedrockEvent(this.world.afterEvents.playerSpawn).pipe(this.onlyWhenCurrentPlayer());

  readonly afterPlayerSwingStart$ = fromBedrockEvent(this.world.afterEvents.playerSwingStart).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerDimensionChange$ = fromBedrockEvent(this.world.afterEvents.playerDimensionChange).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerEmote$ = fromBedrockEvent(this.world.afterEvents.playerEmote).pipe(this.onlyWhenCurrentPlayer());

  readonly afterPlayerGameModeChange$ = fromBedrockEvent(this.world.afterEvents.playerGameModeChange).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerHotbarSelectedSlotChange$ = fromBedrockEvent(
    this.world.afterEvents.playerHotbarSelectedSlotChange
  ).pipe(this.onlyWhenCurrentPlayer());

  readonly afterPlayerInputModeChange$ = fromBedrockEvent(this.world.afterEvents.playerInputModeChange).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerInputPermissionCategoryChange$ = fromBedrockEvent(
    this.world.afterEvents.playerInputPermissionCategoryChange
  ).pipe(this.onlyWhenCurrentPlayer());

  readonly afterPlayerButtonInput$ = fromBedrockEvent(this.world.afterEvents.playerButtonInput).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly afterPlayerItemUse$ = fromBedrockEvent(this.world.afterEvents.itemUse).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );

  readonly afterPlayerItemCompleteUse$ = fromBedrockEvent(this.world.afterEvents.itemCompleteUse).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );

  readonly afterPlayerItemReleaseUse$ = fromBedrockEvent(this.world.afterEvents.itemReleaseUse).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );

  readonly afterPlayerItemStartUse$ = fromBedrockEvent(this.world.afterEvents.itemStartUse).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );

  readonly afterPlayerItemStartUseOn$ = fromBedrockEvent(this.world.afterEvents.itemStartUseOn).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );

  readonly afterPlayerItemStopUse$ = fromBedrockEvent(this.world.afterEvents.itemStopUse).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );

  readonly afterPlayerItemStopUseOn$ = fromBedrockEvent(this.world.afterEvents.itemStopUseOn).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );

  readonly beforePlayerBreakBlock$ = fromBedrockEvent(this.world.beforeEvents.playerBreakBlock).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly beforePlayerInteractWithBlock$ = fromBedrockEvent(this.world.beforeEvents.playerInteractWithBlock).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly beforePlayerInteractWithEntity$ = fromBedrockEvent(this.world.beforeEvents.playerInteractWithEntity).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly beforePlayerLeave$ = fromBedrockEvent(this.world.beforeEvents.playerLeave).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly beforePlayerGameModeChange$ = fromBedrockEvent(this.world.beforeEvents.playerGameModeChange).pipe(
    this.onlyWhenCurrentPlayer()
  );

  readonly beforePlayerItemPickup$ = fromBedrockEvent(this.world.beforeEvents.entityItemPickup).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.entity)
  );

  readonly beforePlayerItemUse$ = fromBedrockEvent(this.world.beforeEvents.itemUse).pipe(
    this.onlyWhenCurrentPlayerIs((event) => event.source)
  );
}
