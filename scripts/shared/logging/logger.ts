import { Lifecycle, scoped, inject } from "tsyringe";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "../../global-tokens";
import { LOG_SETTINGS_TOKEN, LogSettings } from "./log-settings";
import type { System, World } from "@minecraft/server";

@scoped(Lifecycle.ContainerScoped)
export class Logger {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(LOG_SETTINGS_TOKEN) private readonly settings: LogSettings
  ) {}

  log(message: string) {
    if (!this.settings().levels.includes("log")) return;
    this.output(`[log] ${message}`);
  }

  warn(message: string) {
    if (!this.settings().levels.includes("warn")) return;
    this.output(`[warn] ${message}`);
  }

  error(message: string) {
    if (!this.settings().levels.includes("error")) return;
    this.output(`[error] ${message}`);
  }

  private prefix() {
    return `[Tick ${this.system.currentTick}]`;
  }

  private output(message: string) {
    const fullMessage = `${this.prefix()} ${message}`;
    if (this.settings().logToConsole) {
      console.log(fullMessage);
    }
    if (this.settings().logToChat) {
      this.world.sendMessage(fullMessage);
    }
  }
}
