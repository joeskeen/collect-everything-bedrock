import { inject, singleton } from "tsyringe";
import { ItemRegistry } from "./item/item.registry";
import { BiomeRegistry } from "./biome/biome.registry";
import { EntityRegistry } from "./entity/entity.registry";
import { EffectRegistry } from "./effect/effect.registry";
import { EnchantmentRegistry } from "./enchantment/enchantment.registry";
import { UnobtainableRegistry } from "./unobtainable/unobtainable.registry";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, UNOBTAINABLE } from "../player/collection-constants";
import type { Registry } from "./registry";
import { AllRegistry } from "./all-registry";

export const REGISTRY_COLLECTION_TOKEN = Symbol("Aggregate registry collection");

@singleton()
export class RegistryCollection {
  readonly registries: Registry[];

  constructor(
    @inject(ItemRegistry) itemRegistry: ItemRegistry,
    @inject(BiomeRegistry) biomeRegistry: BiomeRegistry,
    @inject(EntityRegistry) entityRegistry: EntityRegistry,
    @inject(EffectRegistry) effectRegistry: EffectRegistry,
    @inject(EnchantmentRegistry) enchantmentRegistry: EnchantmentRegistry,
    @inject(UnobtainableRegistry) unobtainableRegistry: UnobtainableRegistry,
    @inject(AllRegistry) allRegistry: AllRegistry
  ) {
    this.registries = [
      allRegistry,
      itemRegistry,
      biomeRegistry,
      entityRegistry,
      effectRegistry,
      enchantmentRegistry,
      unobtainableRegistry,
    ];
  }

  getByKey(key: string): Registry | undefined {
    return this.registries.find((r) => r.key === key);
  }

  getItem(): ItemRegistry {
    return this.getByKey(ITEM) as ItemRegistry;
  }

  getBiome(): BiomeRegistry {
    return this.getByKey(BIOME) as BiomeRegistry;
  }

  getEntity(): EntityRegistry {
    return this.getByKey(ENTITY) as EntityRegistry;
  }

  getEffect(): EffectRegistry {
    return this.getByKey(EFFECT) as EffectRegistry;
  }

  getEnchantment(): EnchantmentRegistry {
    return this.getByKey(ENCHANTMENT) as EnchantmentRegistry;
  }

  getUnobtainable(): UnobtainableRegistry {
    return this.getByKey(UNOBTAINABLE) as UnobtainableRegistry;
  }
}
