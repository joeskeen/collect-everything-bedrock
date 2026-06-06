import { Lifecycle, scoped, inject } from "tsyringe";
import { PLAYER_TOKEN, SYSTEM_TOKEN, WORLD_TOKEN } from "../../global-tokens";
import { LOG_SETTINGS_TOKEN, LogSettings } from "./log-settings";
import type { Player, System, World } from "@minecraft/server";
import { BLUE, DARK_AQUA, DARK_GRAY, GRAY, MINECOIN_GOLD, RED, RESET } from "../format-codes";

@scoped(Lifecycle.ContainerScoped)
export class Logger {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(LOG_SETTINGS_TOKEN) private readonly settings: LogSettings,
    @inject(PLAYER_TOKEN, { isOptional: true }) private readonly player: Player
  ) {}

  log(...messages: any[]) {
    if (!this.settings().levels.includes("log")) return;
    this.output(`${this.brackets(DARK_AQUA + "log")} ${this.concat(messages)}`);
  }

  warn(...messages: any[]) {
    if (!this.settings().levels.includes("warn")) return;
    this.output(`${this.brackets(MINECOIN_GOLD + "warn")} ${this.concat(messages)}`);
  }

  error(...messages: any[]) {
    if (!this.settings().levels.includes("error")) return;
    this.output(`${this.brackets(RED + "error")} ${this.concat(messages)}`);
  }

  private brackets(message: any) {
    return `${GRAY}[${RESET}${message}${GRAY}]${RESET}`;
  }

  private concat(messages: any[]) {
    return messages.map(String).join("; ");
  }

  private prefix() {
    const parts = [this.brackets(DARK_GRAY + this.system.currentTick)];
    if (this.player) {
      parts.push(this.brackets(BLUE + this.player.name));
    }
    return parts.join("");
  }

  private output(message: string) {
    const fullMessage = `${this.prefix()}${RESET}${message}`;
    if (this.settings().logToConsole) {
      console.log(fullMessage);
    }
    if (this.settings().logToChat) {
      this.world.sendMessage(fullMessage);
    }
  }
}
