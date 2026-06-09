import { inject, singleton } from "tsyringe";
import { EFFECT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { EffectTypes, RawMessage } from "@minecraft/server";
import { formatId } from "../../shared/formatting";

@singleton()
export class EffectRegistry {
  private _initialized = false;
  private effects: string[] = [];

  constructor(@inject(EFFECT_TYPES_TOKEN) private readonly effectTypes: typeof EffectTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.effects = this.effectTypes.getAll().map((e) => e.getName());
      this._initialized = true;
    }
  }

  formatEffect(effectId: string): RawMessage {
    return { text: formatId(effectId) };
  }

  findEffectsByKeyword(word: string): string[] {
    return this.effectTypes
      .getAll()
      .filter((et) => et.getName().includes(word))
      .map((et) => et.getName());
  }

  countCollectedEffects(effects: string[]) {
    this.ensureInitialized();
    const builtInCount = effects.filter((e) => this.effects.includes(e)).length;
    return { collected: builtInCount, extra: effects.length - builtInCount, total: this.effects.length };
  }

  allEffects() {
    this.ensureInitialized();
    return [...this.effects];
  }

  effectCount() {
    this.ensureInitialized();
    return this.effects.length;
  }
}
