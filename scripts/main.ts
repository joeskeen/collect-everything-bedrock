import "./polyfills";
import { container } from "tsyringe";
import { system, world } from "@minecraft/server";
import { CollectEverythingAddOn } from "./system/collect-everything-add-on";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "./shared/global-tokens";
import { getLogSettings, LOG_SETTINGS_TOKEN } from "./shared/logging/log-settings";
import { Logger } from "./shared/logging/logger";
import { CRAFTING_TABLE } from "./shared/emoji";
import { AQUA } from "./shared/format-codes";
import { registerDebugProviders } from "./debug/index";

registerDebugProviders();
container.register(LOG_SETTINGS_TOKEN, { useValue: getLogSettings });
container.register(SYSTEM_TOKEN, { useValue: system });
container.register(WORLD_TOKEN, { useValue: world });
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
