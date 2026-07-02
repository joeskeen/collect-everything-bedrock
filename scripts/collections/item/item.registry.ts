import { inject, singleton } from "tsyringe";
import { ITEM_COMPONENT_TYPES_TOKEN, ITEM_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemComponentTypes, ItemStack, ItemTypes } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { EXCLUDED_ITEMS } from "./item-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import { ITEM } from "../../player/collection-constants";
import type { Registry } from "../registry";
import { getItemTexture } from "./item-texture";

@singleton()
export class ItemRegistry implements Registry<ItemStack> {
  readonly key = ITEM;

  getIcon(): string | number {
    return getItemTexture("minecraft:diamond", false, this._customItemCount);
  }

  private _initialized = false;
  private _customItemCount = 0;
  private items: string[] = [];

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
    const { Potion } = this.itemComponentTypes;
    const potionComponent = itemStack.getComponent(Potion);
    if (potionComponent) {
      return [
        `${this.key};${itemStack.typeId}`,
        `${this.key};${itemStack.typeId}+${potionComponent.potionDeliveryType.id}`,
        `${this.key};${itemStack.typeId}+${potionComponent.potionEffectType.id}`,
        `${this.key};${itemStack.typeId}+${potionComponent.potionDeliveryType.id}+${potionComponent.potionEffectType.id}`,
      ];
    } else if (itemStack.typeId === "minecraft:bed") {
      const color = /^item\.bed\.(.+)\.name$/.exec(itemStack.localizationKey)?.[1];
      return [`${this.key};${itemStack.typeId}`, `${this.key};${itemStack.typeId}+${color}`];
    } else {
      return [`${this.key};${itemStack.typeId}`];
    }
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

  count(items: string[]) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const builtInCount = rawItems.filter((i) => this.items.includes(i)).length;
    return {
      collected: builtInCount,
      extra: items.length - builtInCount,
      total: this.items.length,
    };
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
