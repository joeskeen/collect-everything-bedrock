import { inject, singleton } from "tsyringe";
import { ITEM_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemTypes, RawMessage } from "@minecraft/server";
import { formatId } from "../../shared/formatting";

@singleton()
export class ItemRegistry {
  private _initialized = false;
  private items: string[] = [];

  constructor(@inject(ITEM_TYPES_TOKEN) private readonly itemTypes: typeof ItemTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.items = this.itemTypes.getAll().map((i) => i.id);
      this._initialized = true;
    }
  }

  formatItem(itemId: string): RawMessage {
    const localizationKey = this.itemTypes.get(itemId)?.localizationKey;
    return localizationKey ? { translate: localizationKey } : { text: formatId(itemId) };
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
    return { collected: builtInCount, extra: items.length - builtInCount, total: this.items.length };
  }

  allItems() {
    this.ensureInitialized();
    return [...this.items];
  }

  itemCount() {
    this.ensureInitialized();
    return this.items.length;
  }
}
