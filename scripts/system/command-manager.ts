import { container, DependencyContainer, inject, injectAll, registry, singleton } from "tsyringe";
import {
  ADD_ON_COMMANDS_TOKEN,
  AddOnCommand,
  CommandHandler,
  commandPermissionLevels,
  customCommandStatuses,
} from "./add-on-command";
import { adminSettingsCommand } from "./admin-commands/admin-settings.command";
import { resetAllCommand as adminResetAllCommand } from "./admin-commands/reset-all.command";
import { playerStatsCommand } from "../player/player-commands/stats.command";
import { playerSessionCommand } from "../player/player-commands/session.command";
import { playerCollectedCommand } from "../player/player-commands/collected.command";
import { playerUncollectedCommand } from "../player/player-commands/uncollected.command";
import { playerSettingsCommand } from "../player/player-commands/settings.command";
import { playerAllCommand } from "../player/player-commands/all.command";
import { playerBrowseCommand } from "../player/player-commands/browse.command";
import { playerExtraCommand } from "../player/player-commands/extra.command";
import type { CustomCommandOrigin, CustomCommandResult, Entity, Player, StartupEvent, System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../shared/global-tokens";
import { Disposable } from "../shared/disposable";
import { PlayerManager } from "./player-manager";
import { Logger } from "../shared/logging/logger";

export function isPlayer(entity?: Entity): entity is Player {
  return !!entity && "commandPermissionLevel" in entity && "inputInfo" in entity;
}

@registry([
  { token: ADD_ON_COMMANDS_TOKEN, useValue: adminSettingsCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: adminResetAllCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerStatsCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerSessionCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerCollectedCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerUncollectedCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerAllCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerSettingsCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerBrowseCommand },
  { token: ADD_ON_COMMANDS_TOKEN, useValue: playerExtraCommand },
])
@singleton()
export class CommandManager implements Disposable {
  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerManager) private readonly playerManager: PlayerManager,
    @injectAll(ADD_ON_COMMANDS_TOKEN) private readonly commands: AddOnCommand<CommandHandler>[]
  ) {}

  onStartUp(event: StartupEvent) {
    this.logger.log("registering commands...", JSON.stringify(this.commands));
    for (let command of this.commands) {
      this.logger.log(`registering command ${command.name}...`);
      event.customCommandRegistry.registerCommand(command, (origin, ...args) => this.onCommand(origin, command, args));
    }
    this.logger.log("all commands registered");
  }

  onCommand(origin: CustomCommandOrigin, command: AddOnCommand<CommandHandler>, args: any[]): CustomCommandResult {
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
      return handler.handleCommand(origin, args);
    } catch (err) {
      return {
        message: `Error while executing command ${command.name} in scope '${resolvedScope}': ${err} ${(err as Error).stack}`,
        status: customCommandStatuses.Failure,
      };
    }
  }

  dispose(): void {
    this.system.beforeEvents.startup.unsubscribe(this.onStartUp);
  }
}
