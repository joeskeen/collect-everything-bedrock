import type { Player, World } from "@minecraft/server";
import { inject, Lifecycle, scoped, singleton } from "tsyringe";
import { PLAYER_TOKEN, WORLD_TOKEN } from "./global-tokens";
import { Logger } from "./logging/logger";

export abstract class StorageBase {
  constructor(
    private readonly storageSource: World | Player,
    private readonly logger?: Logger
  ) {}

  get<T>(key: string): T | undefined {
    const value = this.storageSource.getDynamicProperty(key);
    if (value !== undefined && typeof value === "string") {
      return JSON.parse(value) as T;
    }
    return value as T | undefined;
  }
  set<T>(key: string, value: T | undefined): void {
    const text = JSON.stringify(value);
    this.storageSource.setDynamicProperty(key, text);
    this.logger?.debug(`saved ${key}: ${text.length} characters`);
  }
  keys(): string[] {
    return (this.storageSource as World).getDynamicPropertyIds();
  }
  deleteKey(key: string): void {
    this.storageSource.setDynamicProperty(key);
  }
}

@singleton()
export class WorldStorage extends StorageBase {
  constructor(@inject(WORLD_TOKEN) world: World, @inject(Logger) logger: Logger) {
    super(world, logger);
  }
}

@scoped(Lifecycle.ContainerScoped)
export class PlayerStorage extends StorageBase {
  constructor(@inject(PLAYER_TOKEN) player: Player, @inject(Logger) logger: Logger) {
    super(player, logger);
  }
}
