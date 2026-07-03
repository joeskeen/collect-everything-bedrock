import { inject, singleton } from "tsyringe";
import { formatId } from "../../shared/formatting";
import { UNOBTAINABLE_BUT_BREAKABLE } from "./unobtainables";
import { UNOBTAINABLE } from "../../player/collection-constants";
import { DifficultyLevel } from "../../player/player-settings";
import type { Registry, Thing } from "../registry";
import { getItemTexture } from "../item/item-texture";
import { ItemRegistry } from "../item/item.registry";

@singleton()
export class UnobtainableRegistry implements Registry {
  readonly key = UNOBTAINABLE;

  getIcon(): string | number {
    return "textures/blocks/mob_spawner";
  }

  private unobtainables: string[] = [];
  private formatCache = new Map<string, string>();
  private cachedAllCache = new Map<DifficultyLevel, Thing[]>();

  constructor(@inject(ItemRegistry) private readonly itemRegistry: ItemRegistry) {
    this.unobtainables = [...UNOBTAINABLE_BUT_BREAKABLE];
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
      const prefixedIds = this.unobtainables.map((id) => `${this.key};${id}`);
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

  isUnobtainable(id: string): boolean {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return this.unobtainables.includes(rawId);
  }

  findByKeyword(word: string): string[] {
    return this.unobtainables.filter((id) => id.includes(word)).map((id) => `${this.key};${id}`);
  }

  count(items: string[], _difficulty?: string) {
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    let collected = 0;
    let unknownCount = 0;
    for (const rawId of rawItems) {
      if (this.unobtainables.includes(rawId)) {
        collected++;
      } else {
        unknownCount++;
      }
    }
    return { collected, extra: unknownCount, total: this.unobtainables.length, ignored: 0 };
  }

  getExtra(collectedKeys: string[]) {
    const allKnown = new Set(this.unobtainables);
    return collectedKeys.filter((key) => !allKnown.has(key)).map((key) => `${this.key};${key}`);
  }

  enumerateVariants(id: string): string[] {
    return [`${this.key};${id}`];
  }

  countVariants(id: string): number {
    return 1;
  }

  unobtainableCount() {
    return this.unobtainables.length;
  }

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return getItemTexture(rawId, false, this.itemRegistry.customItemCount());
  }

  identify(blockId?: unknown): string[] {
    return blockId ? [`${this.key};${blockId}`] : [];
  }
}
