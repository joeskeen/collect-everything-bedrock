import { inject, singleton } from "tsyringe";
import { ITEM_COMPONENT_TYPES_TOKEN, ITEM_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemComponentTypes, ItemStack, ItemTypes } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { EXCLUDED_ITEMS } from "./item-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import { ITEM } from "../../player/collection-constants";
import type { Registry, Thing } from "../registry";
import { getItemTexture } from "./item-texture";
import { IdentifyItem } from "./identify-item";
import { createItemVariantCounter } from "./item-variants";

@singleton()
export class ItemRegistry implements Registry<ItemStack> {
  readonly key = ITEM;

  getIcon(): string | number {
    return getItemTexture("minecraft:diamond", false, this._customItemCount);
  }

  private _initialized = false;
  private _customItemCount = 0;
  private items: string[] = [];
  private variantCounter = createItemVariantCounter();
  private allItemVariants = new Set<string>();
  private formatCache = new Map<string, string>();
  private cachedAllCache = new Map<DifficultyLevel, Thing[]>();

  constructor(
    @inject(ITEM_TYPES_TOKEN) private readonly itemTypes: typeof ItemTypes,
    @inject(ITEM_COMPONENT_TYPES_TOKEN) private readonly itemComponentTypes: typeof ItemComponentTypes
  ) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.items = this.itemTypes
        .getAll()
        .map((i) => i.id)
        .filter((i) => !EXCLUDED_ITEMS.includes(i));
      this._customItemCount = this.itemTypes
        .getAll()
        .map((i) => i.id)
        .filter((i) => !i.startsWith("minecraft:")).length;
      for (const id of this.items) {
        for (const variant of this.variantCounter.enumerateItemVariants(id)) {
          this.allItemVariants.add(variant);
        }
      }
      this._initialized = true;
    }
  }

  customItemCount() {
    this.ensureInitialized();
    return this._customItemCount;
  }

  identify(itemStack: ItemStack): string[] {
    return IdentifyItem(itemStack, this.itemComponentTypes).map((id) => `${this.key};${id}`);
  }

  enumerateVariants(id: string): string[] {
    this.ensureInitialized();
    return this.variantCounter.enumerateItemVariants(id).map((variant) => `${this.key};${variant}`);
  }

  countVariants(id: string): number {
    this.ensureInitialized();
    return this.variantCounter.countItemVariants(id);
  }

  format(fullItemId: string): string {
    if (!this.formatCache.has(fullItemId)) {
      const rawId = fullItemId.includes(";") ? fullItemId.split(";")[1] : fullItemId;
      const [itemId, ...variants] = rawId.split("+");
      let formatted = formatId(itemId);
      if (variants.length) {
        formatted += ` (${variants.map((id) => formatId(id)).join(", ")})`;
      }
      this.formatCache.set(fullItemId, formatted);
    }
    return this.formatCache.get(fullItemId)!;
  }

  all(difficulty: DifficultyLevel): Thing[] {
    if (!this.cachedAllCache.has(difficulty)) {
      this.ensureInitialized();
      const prefixedIds = this.items.map((id) => `${this.key};${id}`);
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
    return this.itemTypes
      .getAll()
      .filter((it) => it.id.includes(word))
      .map((it) => `${this.key};${it.id}`);
  }

  count(items: string[], _difficulty?: string) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    let collected = 0;
    let unknownCount = 0;
    let ignoredCount = 0;
    for (const rawId of rawItems) {
      if (this.items.includes(rawId)) {
        collected++;
      } else {
        const baseId = rawId.split("+")[0];
        if (!this.items.includes(baseId)) {
          unknownCount++;
        } else {
          ignoredCount++;
        }
      }
    }
    return {
      collected,
      extra: unknownCount,
      total: this.items.length,
      ignored: ignoredCount,
    };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    return collectedKeys
      .filter((key) => {
        const suffix = key.includes(";") ? key.split(";")[1] : key;
        return !this.allItemVariants.has(suffix);
      })
      .map((key) => `${this.key};${key}`);
  }

  itemCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.items.length;
  }

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return getItemTexture(rawId, false, this._customItemCount);
  }
}
