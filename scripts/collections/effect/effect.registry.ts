import { inject, singleton } from "tsyringe";
import { EFFECT_TYPES_TOKEN } from "../../shared/global-tokens";
import type { Effect, EffectTypes } from "@minecraft/server";
import { formatId, toRoman } from "../../shared/formatting";
import { EXCLUDED_EFFECTS } from "./effect-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import { EFFECT } from "../../player/collection-constants";
import type { Registry } from "../registry";
import EFFECTS, { EffectData } from "./effects";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";

@singleton()
export class EffectRegistry implements Registry<Effect> {
  readonly key = EFFECT;

  getIcon(): string | number {
    return "textures/ui/particles";
  }

  private _initialized = false;
  private effects: string[] = [];
  private effectsByDifficulty: Record<string, string[]> = { basic: [], committed: [], insane: [] };
  private allVariantKeys = new Set<string>();

  constructor(@inject(EFFECT_TYPES_TOKEN) private readonly effectTypes: typeof EffectTypes) {}

  private getMeta(id: string): EffectData | undefined {
    return EFFECTS[id as keyof typeof EFFECTS] as EffectData | undefined;
  }

  private isExcluded(id: string, amp: number): boolean {
    const meta = this.getMeta(id);
    return meta?.excludedAmplifiers?.includes(amp) ?? false;
  }

  private ensureInitialized() {
    if (!this._initialized) {
      this.effects = this.effectTypes
        .getAll()
        .map((e) => e.getName())
        .filter((e) => !EXCLUDED_EFFECTS.includes(e));

      this.allVariantKeys = new Set<string>();
      const basic: string[] = [];
      const committed: string[] = [];
      const insane: string[] = [];

      for (const id of this.effects) {
        basic.push(id);
        committed.push(id);
        const maxAmp = this.getMeta(id)?.maxAmplifier ?? 0;

        this.allVariantKeys.add(id);
        for (let amp = 0; amp <= maxAmp; amp++) {
          this.allVariantKeys.add(`${id}+${amp}`);
          if (maxAmp > 0 && !this.isExcluded(id, amp)) {
            insane.push(`${id}+${amp}`);
          }
        }
        if (maxAmp === 0) {
          insane.push(id);
        }
      }

      this.effectsByDifficulty = { basic, committed, insane };
      this._initialized = true;
    }
  }

  identify(effect: Effect): string[] {
    return [`${this.key};${effect.typeId}`, `${this.key};${effect.typeId}+${effect.amplifier}`];
  }

  format(id: string): string {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    const parts = rawId.split("+");
    const effectId = parts[0];
    if (parts.length > 1) {
      const meta = this.getMeta(effectId);
      if (meta && meta.maxAmplifier > 0) {
        const amplifier = parseInt(parts[1], 10);
        return `${formatId(effectId)} ${toRoman(amplifier + 1)}`;
      }
    }
    return formatId(effectId);
  }

  findByKeyword(word: string): string[] {
    this.ensureInitialized();
    return this.effects.filter((id) => id.includes(word)).map((id) => `${this.key};${id}`);
  }

  count(items: string[], difficulty?: string) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const targetList = this.effectsByDifficulty[difficulty ?? "basic"] ?? this.effectsByDifficulty.basic;
    const targetSet = new Set(targetList);
    let collected = 0;
    let unknownCount = 0;
    for (const rawId of rawItems) {
      if (targetSet.has(rawId)) {
        collected++;
      } else {
        const baseId = rawId.split("+")[0];
        if (!this.effects.includes(baseId)) {
          unknownCount++;
        }
      }
    }
    return { collected, extra: unknownCount, total: targetList.length };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    return collectedKeys.filter((key) => !this.allVariantKeys.has(key)).map((key) => `${this.key};${key}`);
  }

  enumerateVariants(id: string): string[] {
    const maxAmp = this.getMeta(id)?.maxAmplifier ?? 0;
    const variants: string[] = [`${this.key};${id}`];
    for (let amp = 0; amp <= maxAmp; amp++) {
      if (!this.isExcluded(id, amp)) {
        variants.push(`${this.key};${id}+${amp}`);
      }
    }
    return variants;
  }

  countVariants(id: string): number {
    const meta = this.getMeta(id);
    const maxAmp = meta?.maxAmplifier ?? 0;
    const excludedCount = meta?.excludedAmplifiers?.filter((a) => a <= maxAmp).length ?? 0;
    return maxAmp + 2 - excludedCount;
  }

  all(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.effectsByDifficulty[difficultyLevel].map((id) => `${this.key};${id}`);
  }

  effectCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.effectsByDifficulty[difficultyLevel].length;
  }

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    const effectId = rawId.split("+")[0];
    return this.getMeta(effectId)?.texture ?? UNKNOWN_TEXTURE;
  }
}
