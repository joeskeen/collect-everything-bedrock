import type { System, World } from "@minecraft/server";
import { singleton, inject, DependencyContainer, container } from "tsyringe";
import { PLAYER_SESSION_TOKEN, PLAYER_TOKEN, SYSTEM_TOKEN, WORLD_TOKEN } from "../shared/global-tokens";
import { Logger } from "../shared/logging/logger";
import { PlayerCollection } from "../player/player-collection";
import { PlayerNotifier } from "../player/player-notifier";
import { PlayerSettingsService } from "../player/player-settings";
import { StarterKitService } from "../player/starter-kit";
import { WOOD_SWORD } from "../shared/emoji";
import { BLUE, BOLD, GRAY, GREEN, ITALIC, RED } from "../shared/format-codes";
import { COLLECTOR, Collector } from "../player/collection-constants";

const FIBONACCI_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21];
const FIBONACCI_SEED_TICKS = 10;
const FIBONACCI_BACKOFF = FIBONACCI_SEQUENCE.map((i) => i * FIBONACCI_SEED_TICKS);

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

  async initializePlayer(playerName: string, attempt: number = 0) {
    this.logger.log(`${WOOD_SWORD} Player joined: ${BOLD + BLUE + playerName}`);

    const player = this.world.getPlayers({ name: playerName })[0];
    if (player && attempt === 0) {
      player.sendMessage(`${GRAY}${ITALIC}(Collect Everything!) Initializing...`);
    }

    if (!player) {
      if (attempt >= FIBONACCI_BACKOFF.length) {
        this.logger.error(`Player ${playerName} not found in the world after ${attempt} attempts. Cannot initialize.`);
        return;
      }

      this.logger.debug(
        `Player ${playerName} not found (attempt ${attempt + 1}/${FIBONACCI_BACKOFF.length}). Retrying in ${FIBONACCI_BACKOFF[attempt]} ticks...`
      );
      this.system.runTimeout(() => this.initializePlayer(playerName, attempt + 1), FIBONACCI_BACKOFF[attempt]);
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

      const starterKit = playerContainer.resolve(StarterKitService);
      starterKit.run();

      const notifier = playerContainer.resolve(PlayerNotifier);
      notifier.run();

      const collection = playerContainer.resolve(PlayerCollection);
      collection.run();

      player.sendMessage(`${GREEN}(Collect Everything!) Ready to collect!`);
      this.logger.log(`Player ${playerName} initialized successfully.`);
    } catch (err) {
      player.sendMessage(`${RED}(Collect Everything!) Initialization failed. Some features may not work.`);
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
