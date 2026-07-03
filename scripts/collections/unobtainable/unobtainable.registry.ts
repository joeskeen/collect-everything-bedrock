import { inject, singleton } from "tsyringe";
import { formatId } from "../../shared/formatting";
import { UNOBTAINABLE_BUT_BREAKABLE } from "./unobtainables";
import { UNOBTAINABLE } from "../../player/collection-constants";
import type { Registry } from "../registry";
import { getItemTexture } from "../item/item-texture";
import { ItemRegistry } from "../item/item.registry";

@singleton()
export class UnobtainableRegistry implements Registry {
  readonly key = UNOBTAINABLE;

  getIcon(): string | number {
    return "textures/blocks/mob_spawner";
  }

  private unobtainables: string[] = [];

  constructor(@inject(ItemRegistry) private readonly itemRegistry: ItemRegistry) {
    this.unobtainables = [...UNOBTAINABLE_BUT_BREAKABLE];
  }

  format(id: string): string {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return formatId(rawId);
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
    const builtInCount = rawItems.filter((u) => this.unobtainables.includes(u)).length;
    return { collected: builtInCount, extra: items.length - builtInCount, total: this.unobtainables.length };
  }

  getExtra(collectedKeys: string[]) {
    const allKnown = new Set<string>();
    for (const id of this.all()) {
      allKnown.add(id.includes(";") ? id.split(";")[1] : id);
    }
    return collectedKeys.filter((key) => !allKnown.has(key)).map((key) => `${this.key};${key}`);
  }

  enumerateVariants(id: string): string[] {
    return [`${this.key};${id}`];
  }

  countVariants(id: string): number {
    return 1;
  }

  all() {
    return this.unobtainables.map((id) => `${this.key};${id}`);
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
