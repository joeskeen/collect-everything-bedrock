import { inject, singleton } from "tsyringe";
import { ENTITY_TYPES_TOKEN } from "../../shared/global-tokens";
import type { Entity, EntityTypes } from "@minecraft/server";
import { EXCLUDED_ENTITIES } from "./entity-exclusions";
import { IdentifyEntity } from "./identify-entity";
import { getEntityDisplayName } from "./entity-name";
import { createVariantCounter } from "./entity-variants";
import { enumerateTropicalFishVariants, countTropicalFishVariants } from "./tropicalfish-variants";
import { DifficultyLevel } from "../../player/player-settings";
import { ENTITY } from "../../player/collection-constants";
import type { Registry, Thing } from "../registry";
import ENTITIES from "./entities";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";
import { getItemTexture } from "../item/item-texture";

@singleton()
export class EntityRegistry implements Registry<Entity> {
  readonly key = ENTITY;

  getIcon(): string | number {
    return getItemTexture("minecraft:creeper_head", false, 0);
  }

  private _initialized = false;
  private baseEntities: string[] = [];
  private entitiesByDifficulty: Record<string, string[]> = {
    basic: [],
    committed: [],
    insane: [],
  };
  private variantCounter = createVariantCounter();
  private formatCache = new Map<string, string>();
  private cachedAllCache = new Map<DifficultyLevel, Thing[]>();

  constructor(@inject(ENTITY_TYPES_TOKEN) private readonly entityTypes: typeof EntityTypes) {}

  private enumerateEntity(entityId: string, difficulty: DifficultyLevel): string[] {
    if (entityId === "minecraft:tropicalfish") {
      return enumerateTropicalFishVariants(entityId, difficulty);
    }
    return this.variantCounter.enumerateEntityVariants(entityId, difficulty);
  }

  private countEntity(entityId: string, difficulty: DifficultyLevel): number {
    if (entityId === "minecraft:tropicalfish") {
      return countTropicalFishVariants(entityId, difficulty);
    }
    return this.variantCounter.countEntityVariants(entityId, difficulty);
  }

  private ensureInitialized() {
    if (!this._initialized) {
      const runtimeEntities = this.entityTypes
        .getAll()
        .map((e) => e.id)
        .filter((e) => !EXCLUDED_ENTITIES.includes(e));

      this.baseEntities = runtimeEntities;

      const difficulties: DifficultyLevel[] = ["basic", "committed", "insane"];
      for (const difficulty of difficulties) {
        const allVariants: string[] = [];
        for (const entityId of runtimeEntities) {
          const variants = this.enumerateEntity(entityId, difficulty);
          allVariants.push(...variants);
        }
        this.entitiesByDifficulty[difficulty] = allVariants;
      }

      this._initialized = true;
    }
  }

  identify(entity: Entity): string[] {
    return IdentifyEntity(entity).map((id) => `${this.key};${id}`);
  }

  format(id: string): string {
    if (!this.formatCache.has(id)) {
      const rawId = id.includes(";") ? id.split(";")[1] : id;
      this.formatCache.set(id, getEntityDisplayName(rawId));
    }
    return this.formatCache.get(id)!;
  }

  all(difficulty: DifficultyLevel): Thing[] {
    if (!this.cachedAllCache.has(difficulty)) {
      this.ensureInitialized();
      const rawIds = this.entitiesByDifficulty[difficulty];
      const prefixedIds = rawIds.map((id) => `${this.key};${id}`);
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
    return this.baseEntities.filter((et) => et.includes(word)).map((et) => `${this.key};${et}`);
  }

  count(items: string[], difficulty?: string) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const targetList = this.entitiesByDifficulty[difficulty ?? "basic"] ?? this.entitiesByDifficulty.basic;
    const targetSet = new Set(targetList);
    let collected = 0;
    let unknownCount = 0;
    let ignoredCount = 0;
    for (const rawId of rawItems) {
      if (targetSet.has(rawId)) {
        collected++;
      } else {
        const baseId = rawId.split("+")[0];
        if (!this.baseEntities.includes(baseId)) {
          unknownCount++;
        } else {
          ignoredCount++;
        }
      }
    }
    return { collected, extra: unknownCount, total: targetList.length, ignored: ignoredCount };
  }

  getExtra(collectedKeys: string[]) {
    this.ensureInitialized();
    const allKnown = new Set([
      ...this.entitiesByDifficulty.basic,
      ...this.entitiesByDifficulty.committed,
      ...this.entitiesByDifficulty.insane,
    ]);
    return collectedKeys.filter((key) => !allKnown.has(key)).map((key) => `${this.key};${key}`);
  }

  entityTypeCount(difficultyLevel: DifficultyLevel = "basic"): number {
    this.ensureInitialized();
    return this.entitiesByDifficulty[difficultyLevel].length;
  }

  enumerateEntityVariants(entityId: string, difficulty: DifficultyLevel = "basic"): string[] {
    return this.enumerateEntity(entityId, difficulty);
  }

  countEntityVariants(entityId: string, difficulty: DifficultyLevel = "basic"): number {
    return this.countEntity(entityId, difficulty);
  }

  enumerateVariants(entityId: string, difficulty: DifficultyLevel = "insane"): string[] {
    return this.enumerateEntity(entityId, difficulty).map((id) => `${this.key};${id}`);
  }

  countVariants(entityId: string, difficulty: DifficultyLevel = "insane"): number {
    return this.countEntity(entityId, difficulty);
  }

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    const baseId = rawId.split("+")[0];
    return ENTITIES[baseId as keyof typeof ENTITIES]?.texture ?? UNKNOWN_TEXTURE;
  }
}
