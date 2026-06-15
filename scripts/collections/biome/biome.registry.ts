import { inject, singleton } from "tsyringe";
import { BIOME_TYPES_TOKEN } from "../../shared/global-tokens";
import type { BiomeTypes, RawMessage } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { BIOME_NAME_OVERRIDES } from "./biome-name-overrides";
import { DifficultyLevel } from "../../player/player-settings";

@singleton()
export class BiomeRegistry {
  private _initialized = false;
  private biomes: string[] = [];

  constructor(@inject(BIOME_TYPES_TOKEN) private readonly biomeTypes: typeof BiomeTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.biomes = this.biomeTypes.getAll().map((b) => b.id);
      this._initialized = true;
    }
  }

  formatBiome(biomeId: string): RawMessage {
    return { text: BIOME_NAME_OVERRIDES[biomeId] ?? formatId(biomeId) };
  }

  findBiomesByKeyword(word: string): string[] {
    return this.biomeTypes
      .getAll()
      .filter(
        (bt) =>
          bt.id.includes(word) ||
          bt.getTags().filter((t) => t.includes(word)) ||
          BIOME_NAME_OVERRIDES[bt.id]?.toLowerCase().includes(word)
      )
      .map((bt) => bt.id);
  }

  countCollectedBiomes(biomes: string[]) {
    this.ensureInitialized();
    const builtInCount = biomes.filter((b) => this.biomes.includes(b)).length;
    return { collected: builtInCount, extra: biomes.length - builtInCount, total: this.biomes.length };
  }

  allBiomes(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return [...this.biomes];
  }

  biomeCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.biomes.length;
  }
}
