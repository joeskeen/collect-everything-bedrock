import { container } from "tsyringe";
import { ADD_ON_COMMANDS_TOKEN } from "../system/add-on-command";
import { debugSettingsCommand } from "../system/debug-commands/debug-settings.command";

export function registerDebugProviders() {
  container.registerInstance(ADD_ON_COMMANDS_TOKEN, debugSettingsCommand);
}
