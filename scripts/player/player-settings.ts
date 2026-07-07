import { inject, Lifecycle, scoped, singleton } from "tsyringe";
import { PlayerStorage, WorldStorage } from "../shared/storage";
import { BROADCAST_COLLECTION_EVENTS_KEY, DISPLAY_SCOREBOARD_KEY, NAMESPACE } from "../shared/constants";

export type DifficultyLevel = "basic" | "committed" | "insane";

export const DIFFICULTY_INDEX_MAP: Record<DifficultyLevel, number> = {
  basic: 0,
  committed: 1,
  insane: 2,
};

export const DIFFICULTY_FROM_INDEX: Record<number, DifficultyLevel> = {
  0: "basic",
  1: "committed",
  2: "insane",
};
export interface PlayerSettings {
  difficulty: DifficultyLevel;
  activeCategory: string;
}

const STORAGE_KEY = NAMESPACE + ":settings";
export const WORLD_DIFFICULTY_STORAGE_KEY = NAMESPACE + ":world_difficulty";

const defaultSettings = () =>
  ({
    difficulty: "basic",
    activeCategory: "all",
  }) as PlayerSettings;

@singleton()
export class WorldSettingsService {
  constructor(@inject(WorldStorage) private readonly worldStorage: WorldStorage) {}

  getWorldDifficulty(): DifficultyLevel | undefined {
    return this.worldStorage.get<DifficultyLevel>(WORLD_DIFFICULTY_STORAGE_KEY);
  }

  setWorldDifficulty(difficulty: DifficultyLevel | undefined): void {
    this.worldStorage.set(WORLD_DIFFICULTY_STORAGE_KEY, difficulty);
  }

  getBroadcastCollectionEvents(): boolean {
    return this.worldStorage.get<boolean>(BROADCAST_COLLECTION_EVENTS_KEY) ?? true;
  }

  setBroadcastCollectionEvents(value: boolean): void {
    this.worldStorage.set(BROADCAST_COLLECTION_EVENTS_KEY, value);
  }

  getDisplayScoreboard(): boolean {
    return this.worldStorage.get<boolean>(DISPLAY_SCOREBOARD_KEY) ?? true;
  }

  setDisplayScoreboard(value: boolean): void {
    this.worldStorage.set(DISPLAY_SCOREBOARD_KEY, value);
  }
}

@scoped(Lifecycle.ContainerScoped)
export class PlayerSettingsService {
  private settings: PlayerSettings = defaultSettings();

  constructor(
    @inject(PlayerStorage) private readonly playerStorage: PlayerStorage,
    @inject(WorldSettingsService) private readonly worldSettings: WorldSettingsService
  ) {}

  run() {
    this.settings = this.playerStorage.get<PlayerSettings>(STORAGE_KEY) ?? defaultSettings();
  }

  get() {
    const worldDifficulty = this.worldSettings.getWorldDifficulty();
    if (worldDifficulty) {
      return { ...this.settings, difficulty: worldDifficulty };
    }
    return this.settings;
  }

  change(settings: PlayerSettings) {
    this.settings = settings;
    this.playerStorage.set(STORAGE_KEY, settings);
  }
}
