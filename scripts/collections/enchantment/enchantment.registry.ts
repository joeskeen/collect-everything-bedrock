import { inject, singleton } from "tsyringe";
import { ENCHANTMENT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemEnchantableComponent } from "@minecraft/server";
import { formatId, toRoman } from "../../shared/formatting";
import { DifficultyLevel } from "../../player/player-settings";
import { ENCHANTMENT } from "../../player/collection-constants";
import type { Registry } from "../registry";
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
        const maxLevel = this.enchantmentMaxLevels.get(id) ?? 1;
        if (maxLevel > 1) {
          for (let level = 1; level <= maxLevel; level++) {
            insane.push(`${id}+${level}`);
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
    return enchantComponent
      .getEnchantments()
      .flatMap((e) => [`${this.key};${e.type.id}`, `${this.key};${e.type.id}+${e.level}`]);
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
    for (const rawId of rawItems) {
      if (targetSet.has(rawId)) {
        collected++;
      } else {
        const baseId = rawId.split("+")[0];
        if (!this.enchantments.includes(baseId)) {
          unknownCount++;
        }
      }
    }
    return { collected, extra: unknownCount, total: targetList.length };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    const allKnown = new Set<string>();
    for (const id of this.enchantments) {
      for (const variant of this.enumerateVariants(id)) {
        allKnown.add(variant.includes(";") ? variant.split(";")[1] : variant);
      }
    }
    return collectedKeys.filter((key) => !allKnown.has(key)).map((key) => `${this.key};${key}`);
  }

  enumerateVariants(id: string): string[] {
    this.ensureInitialized();
    const maxLevel = this.enchantmentMaxLevels.get(id) ?? 1;
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

  all(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.enchantmentsByDifficulty[difficultyLevel].map((id) => `${this.key};${id}`);
  }

  enchantmentCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.enchantmentsByDifficulty[difficultyLevel].length;
  }

  resolveTexture(_id: string): string | number {
    return getItemTexture("minecraft:enchanted_book", true, this.itemRegistry.customItemCount());
  }
}
