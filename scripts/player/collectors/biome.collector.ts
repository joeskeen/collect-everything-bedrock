import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import type { Player, System } from "@minecraft/server";
import { COLLECT_FN, CollectFn } from "../collection-tokens";
import { Logger } from "../../shared/logging/logger";

const BIOME_POLLING_INTERVAL_TICKS = 50;

@scoped(Lifecycle.ContainerScoped)
export class BiomeCollector implements Runnable, Disposable {
  private intervalId: number | null = null;
  private lastBiome: string | null = null;

  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECT_FN) private readonly collectFn: { collect: CollectFn }
  ) {}

  run() {
    this.intervalId = this.system.runInterval(this.tick.bind(this), BIOME_POLLING_INTERVAL_TICKS);
  }

  dispose() {
    if (this.intervalId) {
      this.system.clearRun(this.intervalId);
    }
  }

  tick() {
    const currentBiome = this.player.dimension.getBiome(this.player.location);
    if (currentBiome) {
      const fullBiomeId = currentBiome.id;
      if (fullBiomeId === this.lastBiome) return;

      this.lastBiome = fullBiomeId;
      this.logger.log(`Current biome: ${fullBiomeId}`);
      this.collectFn.collect(`biome:${fullBiomeId}`);
    }
  }
}
