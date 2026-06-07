import { container, DependencyContainer, inject, registry, singleton } from "tsyringe";
import {
  ADD_ON_COMMANDS_TOKEN,
  AddOnCommand,
  COMMAND_HANDLER_CLASSES_TOKEN,
  CommandHandler,
  commandPermissionLevels,
  customCommandStatuses,
} from "./add-on-command";
import { resetAllCommand, ResetAllCommandHandler } from "./admin-commands/reset-all.command";
import { playerStatsCommand } from "../player/player-commands/stats.command";
import type { CustomCommandOrigin, CustomCommandResult, Entity, Player, StartupEvent, System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../shared/global-tokens";
import { Disposable } from "../shared/disposable";
import { PlayerManager } from "./player-manager";
import { Logger } from "../shared/logging/logger";

export function isPlayer(entity?: Entity): entity is Player {
  return !!entity && "commandPermissionLevel" in entity && "inputInfo" in entity;
}

@registry([
  { token: ADD_ON_COMMANDS_TOKEN, useValue: [resetAllCommand, playerStatsCommand] as AddOnCommand<CommandHandler>[] },
])
@singleton()
export class CommandManager implements Disposable {
  private readonly subscriptions: Function[] = [];

  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerManager) private readonly playerManager: PlayerManager,
    @inject(ADD_ON_COMMANDS_TOKEN) private readonly commands: AddOnCommand<CommandHandler>[]
  ) {}

  onStartUp(event: StartupEvent) {
    this.logger.log("registering commands...", JSON.stringify(this.commands));
    for (let command of this.commands) {
      this.logger.log(`registering command ${command.name}...`);
      event.customCommandRegistry.registerCommand(command, (origin) => this.onCommand(origin, command));
    }
    this.logger.log("all commands registered");
  }

  onCommand(origin: CustomCommandOrigin, command: AddOnCommand<CommandHandler>): CustomCommandResult {
    const commandScope = command.permissionLevel;
    const source = origin.sourceEntity;

    let resolvedScope = "global";
    let scopedContainer: DependencyContainer = container;

    if (isPlayer(source) && commandScope === commandPermissionLevels.Any) {
      const playerContainer = this.playerManager.getPlayerContainer(source.name);
      if (!playerContainer) {
        return {
          message: `attempted to execute command ${command.name} in player-scope '${source.name}', but no such player is registered.`,
          status: customCommandStatuses.Failure,
        };
      }
      resolvedScope = source.name;
      scopedContainer = playerContainer;
    }

    try {
      const handler = scopedContainer.resolve(command.handlerClass as any) as CommandHandler;
      return handler.handleCommand(origin);
    } catch (err) {
      return {
        message: `Error while executing command ${command.name} in scope '${resolvedScope}': ${err}`,
        status: customCommandStatuses.Failure,
      };
    }
  }

  dispose(): void {
    this.system.beforeEvents.startup.unsubscribe(this.onStartUp);
  }
}
