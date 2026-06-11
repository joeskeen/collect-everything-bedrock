import { Player, System } from "@minecraft/server";
import { Logger } from "../../shared/logging.js";
export class BiomeCollector {
    collect;
    static BIOME_POLLING_INTERVAL_TICKS = 50;
    logger;
    player;
    system;
    intervalId;
    lastBiome = null;
    constructor(di, collect) {
        this.collect = collect;
        this.logger = di.get(Logger);
        this.player = di.get(Player);
        this.system = di.get(System);
        this.intervalId = this.system.runInterval(this.checkBiome.bind(this), BiomeCollector.BIOME_POLLING_INTERVAL_TICKS);
    }
    dispose() {
        this.system.clearRun(this.intervalId);
    }
    checkBiome() {
        const currentBiome = this.player.dimension.getBiome(this.player.location);
        if (currentBiome) {
            const fullBiomeId = currentBiome.id;
            if (fullBiomeId === this.lastBiome)
                return;
            this.lastBiome = fullBiomeId;
            this.logger.debug(`Current biome: ${fullBiomeId}`);
            this.collect(`biome:${fullBiomeId}`);
        }
    }
}
