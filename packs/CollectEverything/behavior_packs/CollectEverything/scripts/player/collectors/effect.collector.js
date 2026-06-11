import { Player, System } from "@minecraft/server";
import { Logger } from "../../shared/logging.js";
export class EffectCollector {
    collect;
    static EFFECT_POLLING_INTERVAL_TICKS = 100;
    logger;
    player;
    system;
    intervalId;
    activeEffects = new Set();
    constructor(di, collect) {
        this.collect = collect;
        this.logger = di.get(Logger);
        this.player = di.get(Player);
        this.system = di.get(System);
        this.intervalId = this.system.runInterval(this.checkEffects.bind(this), EffectCollector.EFFECT_POLLING_INTERVAL_TICKS);
    }
    dispose() {
        this.system.clearRun(this.intervalId);
    }
    collectEffect(effect) {
        const effectId = `${effect.typeId}:${effect.amplifier}`;
        if (this.activeEffects.has(effectId))
            return;
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
        }
        catch (error) {
            this.logger.debug(`Error getting effects: ${error}`);
        }
    }
}
