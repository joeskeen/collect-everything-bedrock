import type { System, World } from "@minecraft/server";
import { singleton, inject, DependencyContainer, container } from "tsyringe";
import { PLAYER_SESSION_TOKEN, PLAYER_TOKEN, SYSTEM_TOKEN, WORLD_TOKEN } from "../shared/global-tokens";
import { Logger } from "../shared/logging/logger";
import { PlayerCollection } from "../player/player-collection";
import { PlayerNotifier } from "../player/player-notifier";
import { PlayerSettingsService } from "../player/player-settings";
import { WOOD_SWORD } from "../shared/emoji";
import { BLUE, BOLD } from "../shared/format-codes";
import { PLAYER_INITIALIZATION_DELAY_TICKS } from "../shared/ticks";
import { COLLECTOR, Collector } from "../player/collection-constants";

@singleton()
export class PlayerManager {
  private readonly players = new Map<string, DependencyContainer>();

  constructor(
    @inject(WORLD_TOKEN) private world: World,
    @inject(SYSTEM_TOKEN) private system: System,
    @inject(Logger) private logger: Logger
  ) {}

  run() {
    // Since this could be loaded at any time, not just world load, we need to
    // initialize any players that are already in the world
    this.world.getAllPlayers().forEach((player) => this.initializePlayer(player.name));

    // Listen for new players joining the world
    this.world.afterEvents.playerJoin.subscribe((e) => this.initializePlayer(e.playerName));

    // Listen for players leaving the world so we can clean up their collections
    this.world.afterEvents.playerLeave.subscribe((e) => this.removePlayer(e.playerName));
  }

  async initializePlayer(playerName: string) {
    this.logger.log(`${WOOD_SWORD} Player joined: ${BOLD + BLUE + playerName}`);

    // if you try to get a player before they are fully loaded you will get an error
    await new Promise((resolve) => this.system.runTimeout(() => resolve(undefined), PLAYER_INITIALIZATION_DELAY_TICKS));

    const player = this.world.getPlayers({ name: playerName })[0];
    if (!player) {
      this.logger.warn(`Player ${playerName} not found in the world. Cannot initialize.`);
      return;
    }
    if (this.players.has(playerName)) {
      this.logger.warn(`Player ${playerName} is already initialized.`);
      return;
    }

    try {
      const playerContainer = container.createChildContainer();
      playerContainer.registerInstance(PLAYER_TOKEN, player);
      playerContainer.registerInstance(PLAYER_SESSION_TOKEN, { startTick: this.system.currentTick });
      playerContainer.registerInstance(COLLECTOR, { collect: () => {} } as Collector);
      this.players.set(playerName, playerContainer);

      const settings = playerContainer.resolve(PlayerSettingsService);
      settings.run();

      const notifier = playerContainer.resolve(PlayerNotifier);
      notifier.run();

      const collection = playerContainer.resolve(PlayerCollection);
      collection.run();

      this.logger.log(`Player ${playerName} initialized successfully.`);
    } catch (err) {
      this.logger.error(`Error initializing ${playerName}:`, err, (err as Error).stack);
    }
  }

  removePlayer(playerName: string) {
    if (!this.players.has(playerName)) {
      this.logger.warn(`Player ${playerName} is not initialized.`);
      return;
    }
    const playerContainer = this.players.get(playerName)!;
    playerContainer.dispose();
    this.players.delete(playerName);
    this.logger.log(`Player ${playerName} removed successfully.`);
  }

  getPlayerContainer(playerName: string) {
    return this.players.get(playerName);
  }
}
