import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import type { Player, System } from "@minecraft/server";
import { BIOME, COLLECTOR, Collector } from "../../player/collection-constants";
import { POLLING_INTERVAL_TICKS } from "../../shared/ticks";
import { BiomeRegistry } from "./biome.registry";

@scoped(Lifecycle.ContainerScoped)
export class BiomeCollector implements Runnable, Disposable {
  private intervalId: number | null = null;
  private lastBiome: string | null = null;

  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(BiomeRegistry) private readonly biomeRegistry: BiomeRegistry
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
    try {
      const currentBiome = this.player.dimension.getBiome(this.player.location);
      const id = currentBiome?.id;
      if (id && id !== this.lastBiome) {
        this.lastBiome = id;
        const prefixedId = this.biomeRegistry.identify(id)[0];
        this.collector.collect(prefixedId, { text: this.biomeRegistry.format(prefixedId) });
      }
    } catch {
      // player is outside of world boundary, ignore
    }
  }
}
