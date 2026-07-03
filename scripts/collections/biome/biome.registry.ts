import { inject, singleton } from "tsyringe";
import { BIOME_TYPES_TOKEN } from "../../shared/global-tokens";
import type { BiomeTypes } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { BIOME_NAME_OVERRIDES } from "./biome-name-overrides";
import { BIOME_EXCLUSIONS } from "./biome-exclusions";
import { DifficultyLevel } from "../../player/player-settings";
import BIOMES from "./biomes";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";
import { BIOME } from "../../player/collection-constants";
import type { Registry, Thing } from "../registry";
import { getItemTexture } from "../item/item-texture";

type KnownBiomeId = keyof typeof BIOMES;

@singleton()
export class BiomeRegistry implements Registry {
  readonly key = BIOME;

  getIcon(): string | number {
    return getItemTexture("minecraft:oak_sapling", false, 0);
  }

  private _initialized = false;
  private biomes: string[] = [];
  private formatCache = new Map<string, string>();
  private cachedAllCache = new Map<DifficultyLevel, Thing[]>();

  constructor(@inject(BIOME_TYPES_TOKEN) private readonly biomeTypes: typeof BiomeTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.biomes = this.biomeTypes
        .getAll()
        .map((b) => b.id)
        .filter((b) => !BIOME_EXCLUSIONS.includes(b));
      this._initialized = true;
    }
  }

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    if (rawId in BIOMES) {
      const metadata = BIOMES[rawId as KnownBiomeId];
      return metadata.texture;
    }

    return UNKNOWN_TEXTURE;
  }

  format(id: string): string {
    if (!this.formatCache.has(id)) {
      const rawId = id.includes(";") ? id.split(";")[1] : id;
      this.formatCache.set(id, BIOME_NAME_OVERRIDES[rawId] ?? formatId(rawId));
    }
    return this.formatCache.get(id)!;
  }

  all(difficulty: DifficultyLevel): Thing[] {
    if (!this.cachedAllCache.has(difficulty)) {
      this.ensureInitialized();
      const prefixedIds = this.biomes.map((id) => `${this.key};${id}`);
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
    return this.biomeTypes
      .getAll()
      .filter(
        (bt) =>
          bt.id.includes(word) ||
          bt.getTags().filter((t) => t.includes(word)) ||
          BIOME_NAME_OVERRIDES[bt.id]?.toLowerCase().includes(word)
      )
      .map((bt) => `${this.key};${bt.id}`);
  }

  count(items: string[], _difficulty?: string) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    let collected = 0;
    let unknownCount = 0;
    for (const rawId of rawItems) {
      if (this.biomes.includes(rawId)) {
        collected++;
      } else {
        unknownCount++;
      }
    }
    return { collected, extra: unknownCount, total: this.biomes.length, ignored: 0 };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    const allKnown = new Set(this.biomes);
    return collectedKeys.filter((key) => !allKnown.has(key)).map((key) => `${this.key};${key}`);
  }

  enumerateVariants(id: string): string[] {
    return [`${this.key};${id}`];
  }

  countVariants(id: string): number {
    return 1;
  }

  biomeCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.biomes.length;
  }

  identify(biomeId?: string): string[] {
    return biomeId ? [`${this.key};${biomeId}`] : [];
  }
}
