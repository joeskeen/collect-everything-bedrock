import { Player } from "@minecraft/server";
import { DiContainer } from "./di.js";

export type LogLevel = keyof Logger;
export const LOG_LEVEL_TOKEN = Symbol('LOG_LEVEL');

export class Logger {
  private readonly logLevels: LogLevel[];
  private prefix = '[CollectEverything]';

  constructor(private readonly diContainer: DiContainer) {
    this.logLevels = this.diContainer.get(LOG_LEVEL_TOKEN, []);
    const player = this.diContainer.get<Player | null>(Player, null);
    if (player) {
      this.prefix += `[${player.name}]`;
    }
  }

  debug(message: string) {
    if (!this.logLevels.includes('debug')) return;
    console.log(`[DEBUG]${this.prefix} ${message}`);
  }
  log(message: string) {
    if (!this.logLevels.includes('log')) return;
    console.log(`[LOG]${this.prefix} ${message}`);
  }
  warn(message: string) {
    if (!this.logLevels.includes('warn')) return;
    console.log(`[WARN]${this.prefix} ${message}`);
  }
  error(message: string) {
    if (!this.logLevels.includes('error')) return;
    console.log(`[ERROR]${this.prefix} ${message}`);
  }
}
