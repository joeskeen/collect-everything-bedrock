import { inject, singleton } from "tsyringe";
import { ENCHANTMENT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { ItemEnchantableComponent } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { DifficultyLevel } from "../../player/player-settings";
import { ENCHANTMENT } from "../../player/collection-constants";
import type { Registry } from "../registry";
import { getItemTexture } from "../item/item-texture";

@singleton()
export class EnchantmentRegistry implements Registry<ItemEnchantableComponent | undefined> {
  readonly key = ENCHANTMENT;

  getIcon(): string | number {
    return getItemTexture("minecraft:enchanted_book", true, 0);
  }

  private _initialized = false;
  private enchantments: string[] = [];

  constructor(@inject(ENCHANTMENT_TYPES_TOKEN) private readonly enchantmentTypes: typeof import("@minecraft/server").EnchantmentTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.enchantments = this.enchantmentTypes.getAll().map((e) => e.id);
      this._initialized = true;
    }
  }

  identify(enchantComponent?: ItemEnchantableComponent): string[] {
    if (!enchantComponent) {
      return [];
    }
    return enchantComponent.getEnchantments().flatMap((e) => [`${this.key};${e.type.id}`, `${this.key};${e.type.id}+${e.level}`]);
  }

  format(id: string): string {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return formatId(rawId);
  }

  findByKeyword(word: string): string[] {
    return this.enchantmentTypes
      .getAll()
      .filter((et) => et.id.includes(word))
      .map((et) => `${this.key};${et.id}`);
  }

  count(items: string[]) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const builtInCount = rawItems.filter((e) => this.enchantments.includes(e)).length;
    return { collected: builtInCount, extra: items.length - builtInCount, total: this.enchantments.length };
  }

  all(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.enchantments.map((id) => `${this.key};${id}`);
  }

  enchantmentCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.enchantments.length;
  }

  resolveTexture(): string | number {
    return getItemTexture("minecraft:enchanted_book", true, 0);
  }
}
