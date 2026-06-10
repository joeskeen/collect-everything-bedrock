import "./polyfills";
import { container } from "tsyringe";
import {
  system,
  world,
  BiomeTypes,
  ItemTypes,
  EffectTypes,
  EnchantmentTypes,
  DimensionTypes,
  EntityTypes,
  BlockTypes,
  ItemComponentTypes,
  ItemEnchantableComponent,
  EntityComponentTypes,
} from "@minecraft/server";
import { CollectEverythingAddOn } from "./system/collect-everything-add-on";
import {
  BIOME_TYPES_TOKEN,
  BLOCK_TYPES_TOKEN,
  DIMENSION_TYPES_TOKEN,
  EFFECT_TYPES_TOKEN,
  ENCHANTMENT_TYPES_TOKEN,
  ENTITY_COMPONENT_TYPES_TOKEN,
  ENTITY_TYPES_TOKEN,
  ITEM_COMPONENT_TYPES_TOKEN,
  ITEM_ENCHANTABLE_COMPONENT_TOKEN,
  ITEM_TYPES_TOKEN,
  SYSTEM_TOKEN,
  WORLD_TOKEN,
} from "./shared/global-tokens";
import { getLogSettings, LOG_SETTINGS_TOKEN } from "./shared/logging/log-settings";
import { Logger } from "./shared/logging/logger";
import { CRAFTING_TABLE } from "./shared/emoji";
import { AQUA } from "./shared/format-codes";
import { registerDebugProviders } from "./debug/index";

registerDebugProviders();
container.registerInstance(LOG_SETTINGS_TOKEN, getLogSettings);
container.registerInstance(SYSTEM_TOKEN, system);
container.registerInstance(WORLD_TOKEN, world);
container.registerInstance(BIOME_TYPES_TOKEN, BiomeTypes);
container.registerInstance(ITEM_TYPES_TOKEN, ItemTypes);
container.registerInstance(EFFECT_TYPES_TOKEN, EffectTypes);
container.registerInstance(ENCHANTMENT_TYPES_TOKEN, EnchantmentTypes);
container.registerInstance(DIMENSION_TYPES_TOKEN, DimensionTypes);
container.registerInstance(ENTITY_TYPES_TOKEN, EntityTypes);
container.registerInstance(BLOCK_TYPES_TOKEN, BlockTypes);
container.registerInstance(ITEM_COMPONENT_TYPES_TOKEN, ItemComponentTypes);
container.registerInstance(ENTITY_COMPONENT_TYPES_TOKEN, EntityComponentTypes);
container.registerInstance(ITEM_ENCHANTABLE_COMPONENT_TOKEN, ItemEnchantableComponent);
const logger = container.resolve(Logger);

logger.log(`${CRAFTING_TABLE} ${AQUA}Initializing Collect Everything Add-On...`);
const addOn = container.resolve(CollectEverythingAddOn);
system.beforeEvents.startup.subscribe((event) => {
  addOn.startUp(event);
});
system.run(() => {
  try {
    addOn.run();
    logger.log("Collect Everything Add-On initialized successfully.");
  } catch (error) {
    logger.error("Error initializing Collect Everything Add-On:", error);
  }
});
