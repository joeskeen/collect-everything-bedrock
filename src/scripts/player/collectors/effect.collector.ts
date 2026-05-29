import { Player, System, Effect } from "@minecraft/server";
import { DiContainer } from "../../shared/di.js";
import { Logger } from "../../shared/logging.js";
import { CollectFn } from "./collect.js";

export class EffectCollector {
  private static readonly EFFECT_POLLING_INTERVAL_TICKS = 100;

  private readonly logger: Logger;
  private readonly player: Player;
  private readonly system: System;
  private readonly intervalId: number;

  private activeEffects = new Set<string>();

  constructor(di: DiContainer, private readonly collect: CollectFn) {
    this.logger = di.get(Logger);
    this.player = di.get(Player);
    this.system = di.get<System>(System);

    this.intervalId = this.system.runInterval(this.checkEffects.bind(this), EffectCollector.EFFECT_POLLING_INTERVAL_TICKS);
  }

  dispose() {
    this.system.clearRun(this.intervalId);
  }

  private collectEffect(effect: Effect) {
    const effectId = `${effect.typeId}:${effect.amplifier}`;
    if (this.activeEffects.has(effectId)) return;

    this.activeEffects.add(effectId);
    this.logger.debug(`Collected effect: ${effectId}`);
    this.collect(`effect:${effectId}`);
  }

  checkEffects() {
    try {
      const effects = this.player.getEffects();
      for (const effect of effects) {
        this.collectEffect(effect);
      }
    } catch (error) {
      this.logger.debug(`Error getting effects: ${error}`);
    }
  }
}