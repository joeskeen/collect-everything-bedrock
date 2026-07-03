import { inject, singleton } from "tsyringe";
import { ItemRegistry } from "./item/item.registry";
import { BiomeRegistry } from "./biome/biome.registry";
import { EntityRegistry } from "./entity/entity.registry";
import { EffectRegistry } from "./effect/effect.registry";
import { EnchantmentRegistry } from "./enchantment/enchantment.registry";
import { UnobtainableRegistry } from "./unobtainable/unobtainable.registry";
import type { Registry, CollectedCount } from "./registry";
import { DifficultyLevel } from "../player/player-settings";

export const ALL_REGISTRY_TOKEN = Symbol("AllRegistry aggregate registry");

@singleton()
export class AllRegistry implements Registry<string> {
  readonly key = "all";

  getIcon(): string | number {
    return "textures/items/book_normal";
  }

  constructor(
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry,
    @inject(BiomeRegistry) private readonly biomeRegistry: BiomeRegistry,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry,
    @inject(EffectRegistry) private readonly effectRegistry: EffectRegistry,
    @inject(EnchantmentRegistry) private readonly enchantmentRegistry: EnchantmentRegistry,
    @inject(UnobtainableRegistry) private readonly unobtainableRegistry: UnobtainableRegistry
  ) {}

  private get registries(): Registry[] {
    return [
      this.itemRegistry,
      this.biomeRegistry,
      this.entityRegistry,
      this.effectRegistry,
      this.enchantmentRegistry,
      this.unobtainableRegistry,
    ];
  }

  private getRegistryByKey(key: string): Registry | undefined {
    return this.registries.find((r) => r.key === key);
  }

  private getRegistryForId(id: string): Registry {
    const [category] = id.includes(";") ? id.split(";") : [""];
    return this.getRegistryByKey(category) ?? this.itemRegistry;
  }

  all(difficulty: DifficultyLevel): string[] {
    return this.registries.flatMap((r) => r.all(difficulty));
  }

  count(ids: string[], difficulty: DifficultyLevel): CollectedCount {
    const result: CollectedCount = { collected: 0, extra: 0, total: 0 };

    for (const registry of this.registries) {
      const { collected, extra, total } = registry.count(ids, difficulty);
      result.collected += collected;
      result.total += total;
      result.extra += extra;
    }

    return result;
  }

  getExtra(collectedKeys: string[]) {
    return this.registries.flatMap((r) => r.getExtra(collectedKeys));
  }

  enumerateVariants(id: string, difficulty: DifficultyLevel): string[] {
    const [category] = id.includes(";") ? id.split(";") : [""];
    const registry = this.getRegistryByKey(category);
    return registry ? registry.enumerateVariants(id, difficulty) : [`${this.key};${id}`];
  }

  countVariants(id: string, difficulty: DifficultyLevel): number {
    const [category] = id.includes(";") ? id.split(";") : [""];
    const registry = this.getRegistryByKey(category);
    return registry ? registry.countVariants(id, difficulty) : 1;
  }

  identify(): string[] {
    return [];
  }

  format(id: string): string {
    return this.getRegistryForId(id).format(id);
  }

  findByKeyword(word: string): string[] {
    return this.registries.flatMap((r) => r.findByKeyword(word));
  }

  resolveTexture(id: string): string | number {
    return this.getRegistryForId(id).resolveTexture(id);
  }
}
