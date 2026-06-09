import type {
  BiomeTypes,
  ItemTypes,
  EffectTypes,
  EnchantmentTypes,
  DimensionTypes,
  EntityTypes,
  BlockTypes,
  Player,
  System,
  World,
} from "@minecraft/server";
import { InjectionToken } from "tsyringe";

export const SYSTEM_TOKEN: InjectionToken<System> = Symbol("global @minecraft/server `system`");
export const WORLD_TOKEN: InjectionToken<World> = Symbol("global @minecraft/server `world`");
export const PLAYER_TOKEN: InjectionToken<Player> = Symbol("current @minecraft/server `Player` in scope");

export type PlayerSession = { startTick: number };
export const PLAYER_SESSION_TOKEN: InjectionToken<PlayerSession> = Symbol(
  "information about the player's current session"
);

export const BIOME_TYPES_TOKEN: InjectionToken<typeof BiomeTypes> = Symbol("BiomeTypes class from @minecraft/server");
export const ITEM_TYPES_TOKEN: InjectionToken<typeof ItemTypes> = Symbol("ItemTypes class from @minecraft/server");
export const EFFECT_TYPES_TOKEN: InjectionToken<typeof EffectTypes> = Symbol(
  "EffectTypes class from @minecraft/server"
);
export const ENCHANTMENT_TYPES_TOKEN: InjectionToken<typeof EnchantmentTypes> = Symbol(
  "EnchantmentTypes class from @minecraft/server"
);
export const DIMENSION_TYPES_TOKEN: InjectionToken<typeof DimensionTypes> = Symbol(
  "DimensionTypes class from @minecraft/server"
);
export const ENTITY_TYPES_TOKEN: InjectionToken<typeof EntityTypes> = Symbol(
  "EntityTypes class from @minecraft/server"
);
export const BLOCK_TYPES_TOKEN: InjectionToken<typeof BlockTypes> = Symbol("BlockTypes class from @minecraft/server");
