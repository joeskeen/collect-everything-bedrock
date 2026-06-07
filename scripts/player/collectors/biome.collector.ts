import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import type { Player, System } from "@minecraft/server";
import { BIOME, COLLECTOR, Collector } from "../collection-constants";
import { ALL_BIOMES } from "../../data/biomes";
import { POLLING_INTERVAL_TICKS } from "../../shared/ticks";

@scoped(Lifecycle.ContainerScoped)
export class BiomeCollector implements Runnable, Disposable {
  private intervalId: number | null = null;
  private lastBiome: string | null = null;

  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector
  ) {}

  run() {
    this.intervalId = this.system.runInterval(this.tick.bind(this), POLLING_INTERVAL_TICKS);
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
      this.collector.collect(BIOME, fullBiomeId, ALL_BIOMES[fullBiomeId].displayName);
    }
  }
}
