import { container } from "tsyringe";
import { ADD_ON_COMMANDS_TOKEN } from "../system/add-on-command";
import { debugDumpCommand } from "./dump.command";

import { BiomeTypes, system, ItemTypes } from "@minecraft/server";

system.run(() => {
  console.log(
    "biome types",
    BiomeTypes.getAll().map((b) => b.id)
  );
  console.log(
    "item types",
    ItemTypes.getAll().map((i) => i.id)
  );
});

export function registerDebugProviders() {
  container.registerInstance(ADD_ON_COMMANDS_TOKEN, debugDumpCommand);
}
