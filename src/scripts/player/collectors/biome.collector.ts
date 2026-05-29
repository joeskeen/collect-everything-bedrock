import { Player, System, World } from "@minecraft/server";
import {} from './collect.js';
import { DiContainer } from "../../shared/di.js";
import { Logger } from "../../shared/logging.js";
import { CollectFn } from "./collect.js";

export class BiomeCollector {
  private static readonly BIOME_POLLING_INTERVAL_TICKS = 50;

  private readonly logger: Logger;
  private readonly player: Player;
  private readonly system: System;
  private readonly intervalId: number;

  private lastBiome: string | null = null;

  constructor(di: DiContainer, private readonly collect: CollectFn) {
    this.logger = di.get(Logger);
    this.player = di.get(Player);
    this.system = di.get<System>(System);

    this.intervalId = this.system.runInterval(this.checkBiome.bind(this), BiomeCollector.BIOME_POLLING_INTERVAL_TICKS);
  }

  dispose() {
    this.system.clearRun(this.intervalId);
  }

  checkBiome() {
    const currentBiome = this.player.dimension.getBiome(this.player.location);
    if (currentBiome) {
      const fullBiomeId = currentBiome.id;
      if (fullBiomeId === this.lastBiome) return;

      this.lastBiome = fullBiomeId;
      this.logger.debug(`Current biome: ${fullBiomeId}`);
      this.collect(`biome:${fullBiomeId}`);
    }
  }
}