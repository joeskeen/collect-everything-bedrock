import { inject, singleton } from "tsyringe";
import { EFFECT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { Effect, EffectTypes, RawMessage } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { EXCLUDED_EFFECTS } from "./effect-exclusions";
import { DifficultyLevel } from "../../player/player-settings";

@singleton()
export class EffectRegistry {
  private _initialized = false;
  private effects: string[] = [];

  constructor(@inject(EFFECT_TYPES_TOKEN) private readonly effectTypes: typeof EffectTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.effects = this.effectTypes
        .getAll()
        .map((e) => e.getName())
        .filter((e) => !EXCLUDED_EFFECTS.includes(e));
      this._initialized = true;
    }
  }

  identify(effect: Effect) {
    return [effect.typeId, `${effect.typeId}+${effect.amplifier}`];
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

  allEffects(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return [...this.effects];
  }

  effectCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.effects.length;
  }
}
