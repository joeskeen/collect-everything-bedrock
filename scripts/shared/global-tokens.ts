import type {
  BiomeTypes,
  DimensionTypes,
  EffectTypes,
  EnchantmentTypes,
  EquipmentSlot,
  ItemComponentTypes,
  ItemEnchantableComponent,
  ItemStack,
  ItemTypes,
  EntityTypes,
  BlockTypes,
  Player,
  System,
  World,
  EntityComponentTypes,
} from "@minecraft/server";
import type { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
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
export const ITEM_COMPONENT_TYPES_TOKEN: InjectionToken<typeof ItemComponentTypes> = Symbol(
  "ItemComponentTypes from @minecraft/server"
);
export const ENTITY_COMPONENT_TYPES_TOKEN: InjectionToken<typeof EntityComponentTypes> = Symbol(
  "EntityComponentTypes from @minecraft/server"
);
export const EQUIPMENT_SLOT_TOKEN: InjectionToken<typeof EquipmentSlot> = Symbol(
  "EquipmentSlot enum from @minecraft/server"
);
export const ITEM_ENCHANTABLE_COMPONENT_TOKEN: InjectionToken<typeof ItemEnchantableComponent> = Symbol(
  "ItemEnchantableComponent from @minecraft/server"
);
export const BLOCK_TYPES_TOKEN: InjectionToken<typeof BlockTypes> = Symbol("BlockTypes class from @minecraft/server");

export type CreateModalFormFn = () => ModalFormData;
export const CREATE_MODAL_FORM_TOKEN: InjectionToken<CreateModalFormFn> = Symbol("modal form creation function");

export type CreateActionFormFn = () => ActionFormData;
export const CREATE_ACTION_FORM_TOKEN: InjectionToken<CreateActionFormFn> = Symbol("action form creation function");

export type CreateMessageFormFn = () => MessageFormData;
export const CREATE_MESSAGE_FORM_TOKEN: InjectionToken<CreateMessageFormFn> = Symbol("message form creation function");

export const ITEM_STACK_TOKEN: InjectionToken<typeof ItemStack> = Symbol("ItemStack class from @minecraft/server");
