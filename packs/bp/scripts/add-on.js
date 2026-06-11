import { Player, System, World, } from "@minecraft/server";
import { DiContainer } from "./shared/di.js";
import { Logger } from "./shared/logging.js";
import { PlayerCollectionService } from "./player/player-collection.service.js";
import { PlayerStorageService } from "./player/player-storage.service.js";
import { PlayerNotifierService } from "./player/player-notifier.service.js";
import { PlayerCommandService } from "./player/player-command.service.js";
export class CollectEverythingAddOn {
    di;
    players = new Map();
    logger;
    constructor(di) {
        this.di = di;
        this.logger = this.di.get(Logger);
        const world = di.get(World);
        const system = di.get(System);
        world.afterEvents.playerSpawn.subscribe(this.onPlayerSpawn.bind(this));
        world.afterEvents.playerLeave.subscribe(this.onPlayerLeave.bind(this));
        system.beforeEvents.startup.subscribe((init) => {
            const commandService = new PlayerCommandService(this.di, this.players);
            commandService.registerCommands(init);
        });
    }
    getPlayers() {
        return this.players;
    }
    onPlayerSpawn(event) {
        this.logger.debug(`Player spawned: ${event.player.name}`);
        if (this.players.has(event.player.id)) {
            this.logger.debug(`Player ${event.player.name} already registered, skipping`);
            return;
        }
        const player = event.player;
        const playerDi = new DiContainer(this.di);
        playerDi.register(Player, player);
        playerDi.register(Logger, new Logger(playerDi));
        playerDi.register(PlayerNotifierService, new PlayerNotifierService(playerDi));
        playerDi.register(PlayerStorageService, new PlayerStorageService(playerDi));
        playerDi.register(PlayerCollectionService, new PlayerCollectionService(playerDi));
        this.players.set(player.id, {
            player,
            diContainer: playerDi,
        });
    }
    onPlayerLeave(event) {
        this.logger.debug(`Player left: ${event.playerId}`);
        const player = this.players.get(event.playerId);
        if (player) {
            player.diContainer.dispose();
        }
        this.players.delete(event.playerId);
    }
}
