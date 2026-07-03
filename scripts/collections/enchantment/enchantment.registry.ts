import { inject, singleton } from "tsyringe";
import { ENCHANTMENT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemEnchantableComponent } from "@minecraft/server";
import { formatId, toRoman } from "../../shared/formatting";
import { DifficultyLevel } from "../../player/player-settings";
import { ENCHANTMENT } from "../../player/collection-constants";
import type { Registry, Thing } from "../registry";
import { getItemTexture } from "../item/item-texture";
import { ItemRegistry } from "../item/item.registry";
import enchantmentOverrides from "./enchantment-overrides";

@singleton()
export class EnchantmentRegistry implements Registry<ItemEnchantableComponent | undefined> {
  readonly key = ENCHANTMENT;

  getIcon(): string | number {
    return getItemTexture("minecraft:enchanted_book", true, this.itemRegistry.customItemCount());
  }

  private _initialized = false;
  private enchantments: string[] = [];
  private enchantmentMaxLevels = new Map<string, number>();
  private enchantmentsByDifficulty: Record<string, string[]> = { basic: [], committed: [], insane: [] };
  private allVariantSuffixes = new Set<string>();
  private formatCache = new Map<string, string>();
  private cachedAllCache = new Map<DifficultyLevel, Thing[]>();

  constructor(
    @inject(ENCHANTMENT_TYPES_TOKEN)
    private readonly enchantmentTypes: typeof import("@minecraft/server").EnchantmentTypes,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry
  ) {}

  private ensureInitialized() {
    if (!this._initialized) {
      const allTypes = this.enchantmentTypes.getAll();
      this.enchantments = allTypes.map((e) => e.id);
      for (const e of allTypes) {
        this.enchantmentMaxLevels.set(e.id, e.maxLevel);
      }

      const basic: string[] = [];
      const committed: string[] = [];
      const insane: string[] = [];

      for (const id of this.enchantments) {
        basic.push(id);
        committed.push(id);
        this.allVariantSuffixes.add(id);
        const maxLevel = this.enchantmentMaxLevels.get(id) ?? 1;
        if (maxLevel > 1) {
          for (let level = 1; level <= maxLevel; level++) {
            insane.push(`${id}+${level}`);
            this.allVariantSuffixes.add(`${id}+${level}`);
          }
        } else {
          insane.push(id);
        }
      }

      this.enchantmentsByDifficulty = { basic, committed, insane };
      this._initialized = true;
    }
  }

  identify(enchantComponent?: ItemEnchantableComponent): string[] {
    if (!enchantComponent) {
      return [];
    }
    return enchantComponent.getEnchantments().flatMap((e) => {
      const maxLevel = this.enchantmentMaxLevels.get(e.type.id) ?? 1;
      if (maxLevel <= 1) return [`${this.key};${e.type.id}`];
      return [`${this.key};${e.type.id}`, `${this.key};${e.type.id}+${e.level}`];
    });
  }

  format(id: string): string {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    const parts = rawId.split("+");
    const enchantId = parts[0];
    const displayName = enchantmentOverrides[enchantId] ?? formatId(enchantId);
    if (parts.length > 1) {
      const maxLevel = this.enchantmentMaxLevels.get(enchantId) ?? 1;
      if (maxLevel > 1) {
        const level = parseInt(parts[1], 10);
        return `${displayName} ${toRoman(level)}`;
      }
    }
    return displayName;
  }

  all(difficulty: DifficultyLevel): Thing[] {
    if (!this.cachedAllCache.has(difficulty)) {
      this.ensureInitialized();
      const rawIds = this.enchantmentsByDifficulty[difficulty];
      const prefixedIds = rawIds.map((id) => `${this.key};${id}`);
      const formatted = prefixedIds.map((id) => this.format(id));
      const indices = Array.from({ length: prefixedIds.length }, (_, i) => i);
      indices.sort((a, b) => formatted[a].toLowerCase().localeCompare(formatted[b].toLowerCase()));
      this.cachedAllCache.set(
        difficulty,
        indices.map((i) => ({
          id: prefixedIds[i],
          displayName: formatted[i],
          texture: this.resolveTexture(prefixedIds[i]),
          registry: this,
        }))
      );
    }
    return this.cachedAllCache.get(difficulty)!;
  }

  findByKeyword(word: string): string[] {
    this.ensureInitialized();
    return this.enchantments.filter((id) => id.includes(word)).map((id) => `${this.key};${id}`);
  }

  count(items: string[], difficulty?: string) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const targetList = this.enchantmentsByDifficulty[difficulty ?? "basic"] ?? this.enchantmentsByDifficulty.basic;
    const targetSet = new Set(targetList);
    let collected = 0;
    let unknownCount = 0;
    let ignoredCount = 0;
    for (const rawId of rawItems) {
      if (targetSet.has(rawId)) {
        collected++;
      } else {
        const baseId = rawId.split("+")[0];
        if (!this.enchantments.includes(baseId)) {
          unknownCount++;
        } else {
          ignoredCount++;
        }
      }
    }
    return { collected, extra: unknownCount, total: targetList.length, ignored: ignoredCount };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    return collectedKeys
      .filter((key) => {
        const suffix = key.includes(";") ? key.split(";")[1] : key;
        return !this.allVariantSuffixes.has(suffix);
      })
      .map((key) => `${this.key};${key}`);
  }

  enumerateVariants(id: string): string[] {
    this.ensureInitialized();
    const maxLevel = this.enchantmentMaxLevels.get(id) ?? 1;
    if (maxLevel <= 1) return [`${this.key};${id}`];
    const variants: string[] = [`${this.key};${id}`];
    for (let level = 1; level <= maxLevel; level++) {
      variants.push(`${this.key};${id}+${level}`);
    }
    return variants;
  }

  countVariants(id: string): number {
    this.ensureInitialized();
    const maxLevel = this.enchantmentMaxLevels.get(id);
    return maxLevel && maxLevel > 1 ? maxLevel + 1 : 1;
  }

  enchantmentCount(difficultyLevel: DifficultyLevel) {
    this.ensureInitialized();
    return this.enchantmentsByDifficulty[difficultyLevel].length;
  }

  resolveTexture(_id: string): string | number {
    return getItemTexture("minecraft:enchanted_book", true, this.itemRegistry.customItemCount());
  }
}
