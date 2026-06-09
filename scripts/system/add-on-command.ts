import type {
  CommandPermissionLevel,
  CustomCommand,
  CustomCommandOrigin,
  CustomCommandResult,
} from "@minecraft/server";
import { InjectionToken } from "tsyringe";
import { NAMESPACE } from "../shared/constants";

export const commandPermissionLevels: typeof CommandPermissionLevel = {
  /**
   * @remarks
   * Anything can run this level.
   *
   */
  Any: 0,
  /**
   * @remarks
   * Any operator can run this command, including command blocks.
   *
   */
  GameDirectors: 1,
  /**
   * @remarks
   * Any operator can run this command, but NOT command blocks.
   *
   */
  Admin: 2,
  /**
   * @remarks
   * Any server host can run this command.
   *
   */
  Host: 3,
  /**
   * @remarks
   * Only dedicated server can run this command.
   *
   */
  Owner: 4,
};

export const customCommandStatuses = {
  Success: 0,
  Failure: 1,
};

export const ADD_ON_COMMANDS_TOKEN: InjectionToken<AddOnCommand<CommandHandler>> = Symbol("all the custom commands");
export const COMMAND_HANDLER_CLASSES_TOKEN: InjectionToken<Class<CommandHandler>> = Symbol(
  "all the command handler classes for dispatching at runtime"
);

export interface CommandHandler {
  handleCommand(event: CustomCommandOrigin): CustomCommandResult;
}

export type Class<_T = unknown> = Function;
export interface AddOnCommand<T extends CommandHandler> extends CustomCommand {
  handlerClass: Class<T>;
}

export const addOnCommandDefaults: Partial<AddOnCommand<CommandHandler>> = {
  cheatsRequired: false,
  permissionLevel: commandPermissionLevels.Any,
};

export function addOnCommand<T extends CommandHandler>(
  options: Partial<AddOnCommand<T>> & { name: string; handlerClass: Class<T> }
): AddOnCommand<T> {
  return { ...addOnCommandDefaults, ...options, name: `${NAMESPACE}:${options.name}` } as AddOnCommand<CommandHandler>;
}
