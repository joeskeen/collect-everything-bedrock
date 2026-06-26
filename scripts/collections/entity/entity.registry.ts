import { inject, singleton } from "tsyringe";
import { ENTITY_TYPES_TOKEN } from "../../shared/global-tokens";
import type { Entity, EntityTypes, RawMessage } from "@minecraft/server";
import { EXCLUDED_ENTITIES } from "./entity-exclusions";
import { IdentifyEntity } from "./identify-entity";
import { getEntityDisplayName } from "./entity-name";
import { createVariantCounter } from "./entity-variants";
import { DifficultyLevel } from "../../player/player-settings";

@singleton()
export class EntityRegistry {
  private _initialized = false;
  private baseEntities: string[] = [];
  private entitiesByDifficulty: Record<DifficultyLevel, string[]> = {
    basic: [],
    committed: [],
    insane: [],
  };
  private variantCounter = createVariantCounter();

  constructor(@inject(ENTITY_TYPES_TOKEN) private readonly entityTypes: typeof EntityTypes) {}

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
          const variants = this.variantCounter.enumerateEntityVariants(entityId, difficulty);
          allVariants.push(...variants);
        }
        this.entitiesByDifficulty[difficulty] = allVariants;
      }

      this._initialized = true;
    }
  }

  identifyEntity(entity: Entity): string[] {
    return IdentifyEntity(entity);
  }

  formatEntity(fullId: string): RawMessage {
    const displayName = getEntityDisplayName(fullId);
    // console.log(fullId, "->", displayName);
    return { text: displayName };
  }

  findEntitiesByKeyword(word: string): string[] {
    this.ensureInitialized();
    return this.baseEntities.filter((et) => et.includes(word));
  }

  countCollectedEntities(entities: string[]) {
    this.ensureInitialized();
    const allValidEntities = this.entitiesByDifficulty.basic;
    const collected = entities.filter((e) => allValidEntities.includes(e)).length;
    return { collected, extra: entities.length - collected, total: allValidEntities.length };
  }

  allEntities(difficultyLevel: DifficultyLevel = "basic"): string[] {
    this.ensureInitialized();
    return [...this.entitiesByDifficulty[difficultyLevel]];
  }

  entityTypeCount(difficultyLevel: DifficultyLevel = "basic"): number {
    this.ensureInitialized();
    return this.entitiesByDifficulty[difficultyLevel].length;
  }

  enumerateEntityVariants(entityId: string, difficulty: DifficultyLevel = "basic"): string[] {
    return this.variantCounter.enumerateEntityVariants(entityId, difficulty);
  }

  countEntityVariants(entityId: string, difficulty: DifficultyLevel = "basic"): number {
    return this.variantCounter.countEntityVariants(entityId, difficulty);
  }
}
