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
import type { Registry } from "../registry";
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
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return BIOME_NAME_OVERRIDES[rawId] ?? formatId(rawId);
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

  count(items: string[]) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const builtInCount = rawItems.filter((b) => this.biomes.includes(b)).length;
    return { collected: builtInCount, extra: items.length - builtInCount, total: this.biomes.length };
  }

  all(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.biomes.map((id) => `${this.key};${id}`);
  }

  biomeCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.biomes.length;
  }

  identify(biomeId?: string): string[] {
    return biomeId ? [`${this.key};${biomeId}`] : [];
  }
}
