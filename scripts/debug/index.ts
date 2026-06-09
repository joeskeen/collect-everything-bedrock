import { container } from "tsyringe";
import { ADD_ON_COMMANDS_TOKEN } from "../system/add-on-command";
import { debugDumpCommand } from "./dump.command";

export function registerDebugProviders() {
  container.registerInstance(ADD_ON_COMMANDS_TOKEN, debugDumpCommand);
}
