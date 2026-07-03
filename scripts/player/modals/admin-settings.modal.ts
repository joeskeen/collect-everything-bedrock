import { inject, singleton } from "tsyringe";
import type { Player } from "@minecraft/server";
import { DDUI, DDUI_TOKEN } from "../../ui/ui.tokens";
import { WorldStorage } from "../../shared/storage";
import { getLogSettings, setLogSettings, LOG_SETTINGS_STORAGE_KEY } from "../../shared/logging/log-settings";

@singleton()
export class AdminSettingsModal {
  constructor(
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(WorldStorage) private readonly worldStorage: WorldStorage
  ) {}

  async show(player: Player): Promise<void> {
    const currentSettings = getLogSettings();

    const log = new this.ddui.ObservableBoolean(currentSettings.levels.includes("log"), {
      clientWritable: true,
    });
    const warn = new this.ddui.ObservableBoolean(currentSettings.levels.includes("warn"), {
      clientWritable: true,
    });
    const error = new this.ddui.ObservableBoolean(currentSettings.levels.includes("error"), {
      clientWritable: true,
    });
    const logToConsole = new this.ddui.ObservableBoolean(currentSettings.logToConsole, {
      clientWritable: true,
    });
    const logToChat = new this.ddui.ObservableBoolean(currentSettings.logToChat, {
      clientWritable: true,
    });

    const form = new this.ddui.CustomForm(player, "Collect Everything! Admin Settings")
      .header("Logging Levels")
      .toggle("log", log)
      .toggle("warn", warn)
      .toggle("error", error)
      .divider()
      .header("Logging Destinations")
      .toggle("Log to Console", logToConsole)
      .toggle("Log to Chat", logToChat);

    try {
      await form.show();
      const levels: ("log" | "warn" | "error")[] = [];
      if (log.getData()) levels.push("log");
      if (warn.getData()) levels.push("warn");
      if (error.getData()) levels.push("error");

      const newSettings = {
        levels,
        logToConsole: logToConsole.getData(),
        logToChat: logToChat.getData(),
      };

      setLogSettings(newSettings);
      this.worldStorage.set(LOG_SETTINGS_STORAGE_KEY, newSettings);
    } catch (e) {
      console.error(e);
    }
  }
}
