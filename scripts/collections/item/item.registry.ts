import { inject, singleton } from "tsyringe";
import { ITEM_COMPONENT_TYPES_TOKEN, ITEM_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemComponentTypes, ItemStack, ItemTypes } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { EXCLUDED_ITEMS } from "./item-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import { ITEM } from "../../player/collection-constants";
import type { Registry } from "../registry";
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
    const rawId = fullItemId.includes(";") ? fullItemId.split(";")[1] : fullItemId;
    const [itemId, ...variants] = rawId.split("+");
    let formatted = formatId(itemId);
    if (variants.length) {
      formatted += ` (${variants.map((id) => formatId(id)).join(", ")})`;
    }
    return formatted;
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
    const builtInCount = rawItems.filter((i) => this.items.includes(i)).length;
    return {
      collected: builtInCount,
      extra: items.length - builtInCount,
      total: this.items.length,
    };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    const allKnown = new Set<string>();
    for (const baseItem of this.items) {
      for (const variant of this.enumerateVariants(baseItem)) {
        const rawId = variant.includes(";") ? variant.split(";")[1] : variant;
        allKnown.add(rawId);
      }
    }
    return collectedKeys.filter((key) => !allKnown.has(key)).map((key) => `${this.key};${key}`);
  }

  all(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.items.map((id) => `${this.key};${id}`);
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
