import {
  Player,
  PlayerInteractWithEntityAfterEvent,
  EntityDieAfterEvent,
  World,
  Entity,
  EntityComponentTypes,
} from "@minecraft/server";
import { DiContainer } from "../../shared/di.js";
import { Logger } from "../../shared/logging.js";
import { CollectFn } from "./collect.js";

export class EntityCollector {
  private readonly logger: Logger;
  private readonly world: World;
  private readonly player: Player;
  private readonly interactCallback: (
    event: PlayerInteractWithEntityAfterEvent,
  ) => void;
  private readonly dieCallback: (event: EntityDieAfterEvent) => void;
  private readonly unsubscribeInteract: () => void;
  private readonly unsubscribeDie: () => void;

  constructor(
    di: DiContainer,
    private readonly collect: CollectFn,
  ) {
    this.logger = di.get(Logger);
    this.world = di.get<World>(World);
    this.player = di.get(Player);

    this.interactCallback = this.onPlayerInteractWithEntity.bind(this);
    this.dieCallback = this.onEntityDie.bind(this);

    this.world.afterEvents.playerInteractWithEntity.subscribe(
      this.interactCallback,
    );
    this.world.afterEvents.entityDie.subscribe(this.dieCallback);

    this.unsubscribeInteract = () =>
      this.world.afterEvents.playerInteractWithEntity.unsubscribe(
        this.interactCallback,
      );
    this.unsubscribeDie = () =>
      this.world.afterEvents.entityDie.unsubscribe(this.dieCallback);
  }

  private getEntityId(entity: Entity): string {
    let entityId = entity.typeId;

    const variantComponent = entity.getComponent(EntityComponentTypes.Variant);
    if (variantComponent) {
      const variantValue = (variantComponent as any).value;
      if (typeof variantValue === "number") {
        entityId += `:variant:${variantValue}`;
      }
    }

    const markVariantComponent = entity.getComponent("minecraft:mark_variant");
    if (markVariantComponent) {
      const markValue = (markVariantComponent as any).value;
      if (typeof markValue === "number" && markValue !== 0) {
        entityId += `:mark:${markValue}`;
      }
    }

    const climateVariant = entity.getProperty("minecraft:climate_variant");
    if (climateVariant !== undefined && climateVariant !== null) {
      entityId += `:${climateVariant}`;
    }

    const color = entity.getProperty("minecraft:color");
    if (color !== undefined && color !== null) {
      entityId += `:color:${color}`;
    }

    const color2 = entity.getProperty("minecraft:color2");
    if (color2 !== undefined && color2 !== null) {
      entityId += `:color2:${color2}`;
    }

    const isBabyComponent = entity.getComponent(EntityComponentTypes.IsBaby);
    if (isBabyComponent) {
      entityId += ":baby";
    }

    if (
      entity.typeId === "minecraft:villager" ||
      entity.typeId === "minecraft:villager_v2"
    ) {
      const biome = entity.dimension.getBiome(entity.location);
      if (biome) {
        entityId += `:biome:${biome.id}`;
      }
    }

    return entityId;
  }

  private onPlayerInteractWithEntity(
    event: PlayerInteractWithEntityAfterEvent,
  ) {
    if (event.player.id !== this.player.id) return;

    const entity = event.target;
    const beforeItem = event.beforeItemStack;
    const afterItem = event.itemStack;

    const itemConsumed =
      beforeItem?.typeId !== afterItem?.typeId ||
      beforeItem?.amount !== afterItem?.amount;

    const itemUsed =
      beforeItem?.typeId === afterItem?.typeId &&
      beforeItem?.typeId !== undefined;

    if (itemConsumed || itemUsed) {
      const entityId = this.getEntityId(entity);
      this.logger.debug(`Interacted with entity: ${entityId}`);
      this.collect(`entity:${entityId}`);
      return;
    }

    this.logger.debug(
      `Interacted with entity but no significant action: ${entity.typeId}`,
    );
  }

  private onEntityDie(event: EntityDieAfterEvent) {
    const damageSource = event.damageSource;
    if (!damageSource) return;

    const damagingEntity = damageSource.damagingEntity;
    if (!damagingEntity || damagingEntity.id !== this.player.id) return;

    const entityId = this.getEntityId(event.deadEntity);
    this.logger.debug(`Killed entity: ${entityId}`);
    this.collect(`entity:${entityId}`);
  }

  dispose() {
    this.unsubscribeInteract();
    this.unsubscribeDie();
  }
}
