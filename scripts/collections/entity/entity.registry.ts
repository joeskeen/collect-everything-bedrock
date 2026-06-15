import { inject, singleton } from "tsyringe";
import { ENTITY_COMPONENT_TYPES_TOKEN, ENTITY_TYPES_TOKEN } from "../../shared/global-tokens";
import type { Entity, EntityComponentTypes, EntityTypes, RawMessage } from "@minecraft/server";
import { EXCLUDED_ENTITIES } from "./entity-exclusions";
import { trimId } from "../../shared/formatting";
import { capitalCase } from "change-case";
import { DifficultyLevel } from "../../player/player-settings";

export const CLIMATE_VARIANT_PROPERTY = "minecraft:climate_variant";

@singleton()
export class EntityRegistry {
  private _initialized = false;
  private entities: string[] = [];

  constructor(
    @inject(ENTITY_TYPES_TOKEN) private readonly entityTypes: typeof EntityTypes,
    @inject(ENTITY_COMPONENT_TYPES_TOKEN) private readonly entityComponentTypes: typeof EntityComponentTypes
  ) {}

  private ensureInitialized() {
    if (!this._initialized) {
      this.entities = this.entityTypes
        .getAll()
        .map((e) => e.id)
        .filter((e) => !EXCLUDED_ENTITIES.includes(e));
      this._initialized = true;
    }
  }

  identifyEntity(entity: Entity): string[] {
    const { IsBaby, Variant, MarkVariant, Color, Color2, IsCharged, IsIllagerCaptain, IsSheared, IsTamed, Riding } =
      this.entityComponentTypes;
    const variants = [];

    if (entity.getProperty(CLIMATE_VARIANT_PROPERTY)) {
      variants.push(`climateVariant:${entity.getProperty(CLIMATE_VARIANT_PROPERTY)}`);
    }
    if (entity.getComponent(IsBaby)) {
      variants.push(`baby`);
    }
    if (entity.getComponent(Variant)) {
      variants.push(`variant:${entity.getComponent(Variant)?.value}`);
    }
    if (entity.getComponent(MarkVariant)) {
      variants.push(`markVariant:${entity.getComponent(MarkVariant)?.value}`);
    }
    if (entity.getComponent(Color)) {
      variants.push(`color:${entity.getComponent(Color)?.value}`);
    }
    if (entity.getComponent(Color2)) {
      variants.push(`color:${entity.getComponent(Color2)?.value}`);
    }
    if (entity.getComponent(IsCharged)) {
      variants.push("charged");
    }
    if (entity.getComponent(IsIllagerCaptain)) {
      variants.push("illagerCaptain");
    }
    if (entity.getComponent(IsSheared)) {
      variants.push("sheared");
    }
    if (entity.getComponent(IsTamed)) {
      variants.push("tamed");
    }
    if (entity.getComponent(Riding)) {
      variants.push(`jockey:${trimId(entity.getComponent(Riding)!.entityRidingOn.typeId)}`);
    }

    const ids = [
      entity.typeId,
      ...variants.map((v) => `${entity.typeId}+${v}`),
      variants.sort().reduce((prev, curr) => prev + `+${curr}`, entity.typeId),
    ];
    return ids;
  }

  formatEntity(fullId: string): RawMessage {
    const [entityId, ...variants] = fullId.split("+");
    const formatted: RawMessage = {
      rawtext: [{ translate: this.entityTypes.get(entityId)!.localizationKey }],
    };
    if (variants.length) {
      if (variants.length > 1 && entityId === "minecraft:tropicalfish") {
        formatted.rawtext!.push({
          text: ` (${variants
            .map((v) => v.split(":")[1])
            .filter((v) => !!v)
            .join(",")})`,
        });
      } else {
        formatted.rawtext!.push({ text: " (" });
        variants.forEach((v, i) => {
          formatted.rawtext!.push({ text: capitalCase(v) });
          if (i < variants.length - 1) {
            formatted.rawtext!.push({ text: ", " });
          }
        });
        formatted.rawtext!.push({ text: ")" });
      }
    }
    return formatted;
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

  allEntities(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return [...this.entities];
  }

  entityTypeCount(difficultyLevel: DifficultyLevel = "basic") {
    this.ensureInitialized();
    return this.entities.length;
  }
}
