import type { System, World } from "@minecraft/server";
import { singleton, inject, DependencyContainer, container } from "tsyringe";
import { PLAYER_TOKEN, SYSTEM_TOKEN, WORLD_TOKEN } from "../global-tokens";
import { Logger } from "../shared/logging/logger";
import { PlayerCollection } from "../player/player-collection";

const PLAYER_INITIALIZATION_DELAY_TICKS = 100;

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
    const playerContainer = container.createChildContainer();
    playerContainer.register(PLAYER_TOKEN, { useValue: player });
    this.players.set(playerName, playerContainer);
    const collection = playerContainer.resolve(PlayerCollection);
    collection.run();
    this.logger.log(`Player ${playerName} initialized successfully.`);
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
}
