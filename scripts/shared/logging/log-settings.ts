type LogLevels = "debug" | "log" | "warn" | "error";

export const LOG_SETTINGS_STORAGE_KEY = "collecteverything:log_settings";

const logSettingsValue = {
  levels: [] as LogLevels[],
  logToConsole: false,
  logToChat: false,
};
export interface LogSettings {
  (): typeof logSettingsValue;
  set(newSettings: Partial<typeof logSettingsValue>): void;
}

export const LOG_SETTINGS_TOKEN = Symbol("LOG_SETTINGS_TOKEN");

/**
 * Internal: should only be called by Logger instance
 * gets the current log settings. This is a function instead of a direct object to
 * prevent direct mutation of the settings object. To update settings, you MUST
 * use the setLogSettings function. Because you receive a copy of the settings,
 * you MUST call this function every time you want to check settings,
 * because they may have changed since the last time you called it.
 */
export function getLogSettings() {
  return { ...logSettingsValue };
}

/**
 * Updates the log settings. This will affect all Logger instances.
 */
export function setLogSettings(newSettings: Partial<typeof logSettingsValue>) {
  Object.assign(logSettingsValue, newSettings);
}

getLogSettings.set = setLogSettings;
