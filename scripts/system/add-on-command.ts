import type {
  CommandPermissionLevel,
  CustomCommand,
  CustomCommandOrigin,
  CustomCommandResult,
  CustomCommandParamType,
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

/**
 * The types of paramaters accepted by a custom command.
 */
export const customCommandParamType = {
  /**
   * @remarks
   * Block type parameter provides a {@link BlockType}.
   *
   */
  BlockType: "BlockType" as CustomCommandParamType,
  /**
   * @remarks
   * Boolean parameter.
   *
   */
  Boolean: "Boolean" as CustomCommandParamType,
  /**
   * @remarks
   * Entity selector parameter provides an {@link Entity}.
   *
   */
  EntitySelector: "EntitySelector" as CustomCommandParamType,
  /**
   * @remarks
   * Entity type parameter provides an {@link EntityType}.
   *
   */
  EntityType: "EntityType" as CustomCommandParamType,
  /**
   * @remarks
   * Command enum parameter.
   *
   */
  Enum: "Enum" as CustomCommandParamType,
  /**
   * @remarks
   * Float parameter.
   *
   */
  Float: "Float" as CustomCommandParamType,
  /**
   * @remarks
   * Integer parameter.
   *
   */
  Integer: "Integer" as CustomCommandParamType,
  /**
   * @remarks
   * Item type parameter provides an {@link ItemType}.
   *
   */
  ItemType: "ItemType" as CustomCommandParamType,
  /**
   * @remarks
   * Location parameter provides a {@link
   * @minecraft/server.Location}.
   *
   */
  Location: "Location" as CustomCommandParamType,
  /**
   * @remarks
   * Player selector parameter provides a {@link Player}.
   *
   */
  PlayerSelector: "PlayerSelector" as CustomCommandParamType,
  /**
   * @remarks
   * String parameter.
   *
   */
  String: "String" as CustomCommandParamType,
};

export const ADD_ON_COMMANDS_TOKEN: InjectionToken<AddOnCommand<CommandHandler>> = Symbol("all the custom commands");
export const COMMAND_HANDLER_CLASSES_TOKEN: InjectionToken<Class<CommandHandler>> = Symbol(
  "all the command handler classes for dispatching at runtime"
);

export interface CommandHandler {
  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult;
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
