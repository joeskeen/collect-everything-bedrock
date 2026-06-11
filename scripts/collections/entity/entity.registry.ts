import { inject, singleton } from "tsyringe";
import { ENTITY_TYPES_TOKEN } from "../../shared/global-tokens";
import type { EntityTypes, RawMessage } from "@minecraft/server";
import { EXCLUDED_ENTITIES } from "./entity-exclusions";

@singleton()
export class EntityRegistry {
  private _initialized = false;
  private entities: string[] = [];

  constructor(@inject(ENTITY_TYPES_TOKEN) private readonly entityTypes: typeof EntityTypes) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.entities = this.entityTypes
        .getAll()
        .map((e) => e.id)
        .filter((e) => !EXCLUDED_ENTITIES.includes(e));
      this._initialized = true;
    }
  }

  formatEntity(entityId: string): RawMessage {
    return { translate: this.entityTypes.get(entityId)!.localizationKey };
  }

  findEntitiesByKeyword(word: string): string[] {
    return this.entityTypes
      .getAll()
      .filter((et) => et.id.includes(word))
      .map((et) => et.id);
  }

  countCollectedEntities(entities: string[]) {
    this.ensureInitialized();
    const builtInCount = entities.filter((e) => this.entities.includes(e)).length;
    return { collected: builtInCount, extra: entities.length - builtInCount, total: this.entities.length };
  }

  allEntities() {
    this.ensureInitialized();
    return [...this.entities];
  }

  entityCount() {
    this.ensureInitialized();
    return this.entities.length;
  }
}
