import { inject, Lifecycle, scoped } from "tsyringe";
import { PlayerStorage } from "../shared/storage";
import { NAMESPACE } from "../shared/constants";

export type DifficultyLevel = "basic" | "committed" | "insane";
export interface PlayerSettings {
  difficulty: DifficultyLevel;
}

const STORAGE_KEY = NAMESPACE + ":settings";

const defaultSettings = () =>
  ({
    difficulty: "basic",
  }) as PlayerSettings;

@scoped(Lifecycle.ContainerScoped)
export class PlayerSettingsService {
  private settings: PlayerSettings = defaultSettings();

  constructor(@inject(PlayerStorage) private readonly playerStorage: PlayerStorage) {}

  run() {
    this.settings = this.playerStorage.get<PlayerSettings>(STORAGE_KEY) ?? defaultSettings();
  }

  get() {
    return this.settings;
  }

  change(settings: PlayerSettings) {
    this.settings = settings;
    this.playerStorage.set(STORAGE_KEY, settings);
  }
}
