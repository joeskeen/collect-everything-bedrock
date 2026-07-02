import { inject, singleton } from "tsyringe";
import { ENTITY_TYPES_TOKEN } from "../../shared/global-tokens";
import type { Entity, EntityTypes } from "@minecraft/server";
import { EXCLUDED_ENTITIES } from "./entity-exclusions";
import { IdentifyEntity } from "./identify-entity";
import { getEntityDisplayName } from "./entity-name";
import { createVariantCounter } from "./entity-variants";
import { DifficultyLevel } from "../../player/player-settings";
import { ENTITY } from "../../player/collection-constants";
import type { Registry } from "../registry";
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

  identify(entity: Entity): string[] {
    return IdentifyEntity(entity).map((id) => `${this.key};${id}`);
  }

  format(id: string): string {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    return getEntityDisplayName(rawId);
  }

  findByKeyword(word: string): string[] {
    this.ensureInitialized();
    return this.baseEntities.filter((et) => et.includes(word)).map((et) => `${this.key};${et}`);
  }

  count(items: string[]) {
    this.ensureInitialized();
    const rawItems = items.map((i) => (i.includes(";") ? i.split(";")[1] : i));
    const allValidEntities = this.entitiesByDifficulty.basic;
    const collected = rawItems.filter((e) => allValidEntities.includes(e)).length;
    return { collected, extra: items.length - collected, total: allValidEntities.length };
  }

  all(difficultyLevel: DifficultyLevel = "basic"): string[] {
    this.ensureInitialized();
    return this.entitiesByDifficulty[difficultyLevel].map((id) => `${this.key};${id}`);
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

  resolveTexture(id: string): string | number {
    const rawId = id.includes(";") ? id.split(";")[1] : id;
    const baseId = rawId.split("+")[0];
    return ENTITIES[baseId as keyof typeof ENTITIES]?.texture ?? UNKNOWN_TEXTURE;
  }
}
