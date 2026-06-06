import "./polyfills";
import { container } from "tsyringe";
import { system, world } from "@minecraft/server";
import { CollectEverythingAddOn } from "./system/collect-everything-add-on";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "./global-tokens";
import { getLogSettings, LOG_SETTINGS_TOKEN } from "./shared/logging/log-settings";

system.run(() => {
  console.log("Initializing Collect Everything Add-On...");
  container.register(LOG_SETTINGS_TOKEN, { useValue: getLogSettings });
  container.register(SYSTEM_TOKEN, { useValue: system });
  container.register(WORLD_TOKEN, { useValue: world });
  const addOn = container.resolve(CollectEverythingAddOn);
  try {
    addOn.run();
    console.log("Collect Everything Add-On initialized successfully.");
  } catch (error) {
    console.error("Error initializing Collect Everything Add-On:", error);
  }
});
