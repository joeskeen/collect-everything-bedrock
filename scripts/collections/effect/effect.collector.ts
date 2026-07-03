import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import type { Player, System, Effect } from "@minecraft/server";
import { COLLECTOR, Collector, EFFECT } from "../../player/collection-constants";
import { EffectRegistry } from "./effect.registry";

const EFFECT_POLLING_INTERVAL_TICKS = 100;

@scoped(Lifecycle.ContainerScoped)
export class EffectCollector implements Runnable, Disposable {
  private readonly intervalId: number;
  private activeEffects = new Set<string>();

  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(EffectRegistry) private readonly effectRegistry: EffectRegistry
  ) {
    this.intervalId = this.system.runInterval(this.checkEffects.bind(this), EFFECT_POLLING_INTERVAL_TICKS);
  }

  run() {}

  dispose() {
    this.system.clearRun(this.intervalId);
  }

  private readonly checkEffects = () => {
    try {
      const effects = this.player.getEffects();
      const resolvedIds = [];
      for (const effect of effects) {
        const ids = this.effectRegistry.identify(effect);
        for (const id of ids) {
          resolvedIds.push(id);
          if (this.activeEffects.has(id)) continue;

          this.activeEffects.add(id);
          this.collector.collect(id);
        }
      }
      this.activeEffects = new Set(resolvedIds);
    } catch {}
  };
}
