import { inject, singleton } from "tsyringe";
import type { EntityDamageCause } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { EXCLUDED_DAMAGE_CAUSES } from "./death-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import { DEATH } from "../../player/collection-constants";
import type { Registry, Thing } from "../registry";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";
import { ENTITY_DAMAGE_CAUSE_TOKEN } from "../../shared/global-tokens";
import DEATH_CAUSES from "./death-causes";
import { ItemRegistry } from "../item/item.registry";

@singleton()
export class DeathRegistry implements Registry {
  readonly key = DEATH;

  getIcon(): string | number {
    return "textures/ui/heart_background";
  }

  private _initialized = false;
  private damageCauses: string[] = [];
  private formatCache = new Map<string, string>();
  private cachedAllCache = new Map<DifficultyLevel, Thing[]>();

  constructor(
    @inject(ENTITY_DAMAGE_CAUSE_TOKEN) private readonly entityDamageCause: typeof EntityDamageCause,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry
  ) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.damageCauses = (Object.values(this.entityDamageCause) as string[]).filter(
        (cause) => !EXCLUDED_DAMAGE_CAUSES.includes(cause as (typeof EXCLUDED_DAMAGE_CAUSES)[number])
      );
      this._initialized = true;
    }
  }

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    if (rawId in DEATH_CAUSES) {
      let texture: string | number = DEATH_CAUSES[rawId as keyof typeof DEATH_CAUSES].texture;
      if (texture.includes(":")) {
        texture = this.itemRegistry.resolveTexture(texture);
      }
      return texture;
    }
    return UNKNOWN_TEXTURE;
  }

  format(id: string): string {
    if (!this.formatCache.has(id)) {
      const rawId = id.includes(";") ? id.split(";")[1] : id;
      this.formatCache.set(id, formatId(rawId));
    }
    return this.formatCache.get(id)!;
  }

  all(difficulty: DifficultyLevel): Thing[] {
    if (!this.cachedAllCache.has(difficulty)) {
      this.ensureInitialized();
      const prefixedIds = this.damageCauses.map((id) => `${this.key};${id}`);
      const formatted = prefixedIds.map((id) => this.format(id));
      const indices = Array.from({ length: prefixedIds.length }, (_, i) => i);
      indices.sort((a, b) => formatted[a].toLowerCase().localeCompare(formatted[b].toLowerCase()));
      this.cachedAllCache.set(
        difficulty,
        indices.map((i) => ({
          id: prefixedIds[i],
          displayName: formatted[i],
          texture: this.resolveTexture(prefixedIds[i]),
          registry: this,
        }))
      );
    }
    return this.cachedAllCache.get(difficulty)!;
  }

  findByKeyword(word: string): string[] {
    this.ensureInitialized();
    return this.damageCauses.filter((cause) => cause.includes(word)).map((cause) => `${this.key};${cause}`);
  }

  count(items: string[], _difficulty?: string) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    let collected = 0;
    let unknownCount = 0;
    for (const rawId of rawItems) {
      if (this.damageCauses.includes(rawId)) {
        collected++;
      } else {
        unknownCount++;
      }
    }
    return { collected, extra: unknownCount, total: this.damageCauses.length, ignored: 0 };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    const allKnown = new Set(this.damageCauses);
    return collectedKeys.filter((key) => !allKnown.has(key)).map((key) => `${this.key};${key}`);
  }

  enumerateVariants(id: string): string[] {
    return [`${this.key};${id}`];
  }

  countVariants(id: string): number {
    return 1;
  }

  identify(cause?: EntityDamageCause | string): string[] {
    return cause ? [`${this.key};${cause}`] : [];
  }
}
