import { System, system, World, world } from "@minecraft/server";
import { CollectEverythingAddOn } from "./add-on.js";
import { DiContainer } from "./shared/di.js";
import { LOG_LEVEL_TOKEN, Logger } from "./shared/logging.js";

const diContainer = new DiContainer();

diContainer.register(World, world);
diContainer.register(System, system);
diContainer.register(LOG_LEVEL_TOKEN, ["log", "warn", "error", "debug"]);
diContainer.register(Logger, new Logger(diContainer));

new CollectEverythingAddOn(diContainer);
