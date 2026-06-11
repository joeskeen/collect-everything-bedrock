import { Player } from "@minecraft/server";
export const LOG_LEVEL_TOKEN = Symbol('LOG_LEVEL');
export class Logger {
    diContainer;
    logLevels;
    prefix = '[CollectEverything]';
    constructor(diContainer) {
        this.diContainer = diContainer;
        this.logLevels = this.diContainer.get(LOG_LEVEL_TOKEN, []);
        const player = this.diContainer.get(Player, null);
        if (player) {
            this.prefix += `[${player.name}]`;
        }
    }
    debug(message) {
        if (!this.logLevels.includes('debug'))
            return;
        console.log(`[DEBUG]${this.prefix} ${message}`);
    }
    log(message) {
        if (!this.logLevels.includes('log'))
            return;
        console.log(`[LOG]${this.prefix} ${message}`);
    }
    warn(message) {
        if (!this.logLevels.includes('warn'))
            return;
        console.log(`[WARN]${this.prefix} ${message}`);
    }
    error(message) {
        if (!this.logLevels.includes('error'))
            return;
        console.log(`[ERROR]${this.prefix} ${message}`);
    }
}
