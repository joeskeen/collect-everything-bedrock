import "./polyfills";
import { container } from "tsyringe";
import { system, world } from "@minecraft/server";
import { CollectEverythingAddOn } from "./collect-everything-add-on";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "./global-tokens";

system.run(() => {
  container.register(SYSTEM_TOKEN, { useValue: system });
  container.register(WORLD_TOKEN, { useValue: world });

  console.log("hello 1");
  const addOn = container.resolve(CollectEverythingAddOn);
  try {
    addOn.run();
  } catch (error) {
    console.error("Error initializing Collect Everything Add-On:", error);
  }
});
