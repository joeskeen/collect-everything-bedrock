import { inject, singleton } from "tsyringe";
import { ITEM_COMPONENT_TYPES_TOKEN, ITEM_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemComponentTypes, ItemStack, ItemTypes, RawMessage } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { EXCLUDED_ITEMS } from "./item-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import { capitalCase } from "change-case";

@singleton()
export class ItemRegistry {
  private _initialized = false;
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
      this._initialized = true;
    }
  }

  identifyItem(itemStack: ItemStack): string[] {
    const { Potion } = this.itemComponentTypes;
    const potionComponent = itemStack.getComponent(Potion);
    if (potionComponent) {
      return [
        itemStack.typeId,
        `${itemStack.typeId}+${potionComponent.potionDeliveryType.id}`,
        `${itemStack.typeId}+${potionComponent.potionEffectType.id}`,
        `${itemStack.typeId}+${potionComponent.potionDeliveryType.id}+${potionComponent.potionEffectType.id}`,
      ];
    } else if (itemStack.typeId === "minecraft:bed") {
      const color = /^item\.bed\.(.+)\.name$/.exec(itemStack.localizationKey)?.[1];
      // console.log("bed color", capitalCase(color ?? ""));
      return [itemStack.typeId, `${itemStack.typeId}+${color}`];
    } else {
      return [itemStack.typeId];
    }
  }

  formatItem(fullItemId: string): RawMessage {
    const [itemId, ...variants] = fullItemId.split("+");
    const localizationKey = this.itemTypes.get(itemId)?.localizationKey;
    const isBed = itemId === "minecraft:bed"; // TODO: I need to make pluggable formatter
    const formatted = {
      rawtext: [!isBed && localizationKey ? { translate: localizationKey } : { text: formatId(itemId) }],
    };
    if (variants.length) {
      formatted.rawtext.push({ text: ` (${variants.map((id) => formatId(id)).join(", ")})` });
    }
    // console.log(JSON.stringify(formatted));
    return formatted;
  }

  findItemsByKeyword(word: string): string[] {
    return this.itemTypes
      .getAll()
      .filter((it) => it.id.includes(word))
      .map((it) => it.id);
  }

  countCollectedItems(items: string[]) {
    this.ensureInitialized();
    const builtInCount = items.filter((i) => this.items.includes(i)).length;
    return {
      collected: builtInCount,
      extra: items.length - builtInCount,
      total: this.items.length,
    };
  }

  allItems(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return [...this.items];
  }

  itemCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.items.length;
  }
}
