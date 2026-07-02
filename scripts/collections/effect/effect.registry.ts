import { inject, singleton } from "tsyringe";
import { EFFECT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { Effect, EffectTypes } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { EXCLUDED_EFFECTS } from "./effect-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import { EFFECT } from "../../player/collection-constants";
import type { Registry } from "../registry";
import EFFECTS from "./effects";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";

@singleton()
export class EffectRegistry implements Registry<Effect> {
  readonly key = EFFECT;

  getIcon(): string | number {
    return "textures/ui/particles";
  }

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

  identify(effect: Effect): string[] {
    return [`${this.key};${effect.typeId}`, `${this.key};${effect.typeId}+${effect.amplifier}`];
  }

  format(id: string): string {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return formatId(rawId);
  }

  findByKeyword(word: string): string[] {
    return this.effectTypes
      .getAll()
      .filter((et) => et.getName().includes(word))
      .map((et) => `${this.key};${et.getName()}`);
  }

  count(items: string[]) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const builtInCount = rawItems.filter((e) => this.effects.includes(e)).length;
    return { collected: builtInCount, extra: items.length - builtInCount, total: this.effects.length };
  }

  all(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.effects.map((id) => `${this.key};${id}`);
  }

  effectCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.effects.length;
  }

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return EFFECTS[rawId as keyof typeof EFFECTS]?.texture ?? UNKNOWN_TEXTURE;
  }
}
