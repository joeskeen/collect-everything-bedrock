import { inject, singleton } from "tsyringe";
import { ENCHANTMENT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { EnchantmentTypes, RawMessage } from "@minecraft/server";
import { formatId } from "../../shared/formatting";

@singleton()
export class EnchantmentRegistry {
  private _initialized = false;
  private enchantments: string[] = [];

  constructor(@inject(ENCHANTMENT_TYPES_TOKEN) private readonly enchantmentTypes: typeof EnchantmentTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.enchantments = this.enchantmentTypes.getAll().map((e) => e.id);
      this._initialized = true;
    }
  }

  formatEnchantment(enchantmentId: string): RawMessage {
    return { text: formatId(enchantmentId) };
  }

  findEnchantmentsByKeyword(word: string): string[] {
    return this.enchantmentTypes
      .getAll()
      .filter((et) => et.id.includes(word))
      .map((et) => et.id);
  }

  countCollectedEnchantments(enchantments: string[]) {
    this.ensureInitialized();
    const builtInCount = enchantments.filter((e) => this.enchantments.includes(e)).length;
    return { collected: builtInCount, extra: enchantments.length - builtInCount, total: this.enchantments.length };
  }

  allEnchantments() {
    this.ensureInitialized();
    return [...this.enchantments];
  }

  enchantmentCount() {
    this.ensureInitialized();
    return this.enchantments.length;
  }
}
