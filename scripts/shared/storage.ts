import type { Player, World } from "@minecraft/server";
import { inject, Lifecycle, scoped, singleton } from "tsyringe";
import { PLAYER_TOKEN, WORLD_TOKEN } from "./global-tokens";

export abstract class StorageBase {
  constructor(private readonly storageSource: World | Player) {}

  get<T>(key: string): T | undefined {
    const value = this.storageSource.getDynamicProperty(key);
    if (value !== undefined && typeof value === "string") {
      return JSON.parse(value) as T;
    }
    return value as T | undefined;
  }
  set<T>(key: string, value: T | undefined): void {
    this.storageSource.setDynamicProperty(key, JSON.stringify(value));
  }
}

@singleton()
export class WorldStorage extends StorageBase {
  constructor(@inject(WORLD_TOKEN) world: World) {
    super(world);
  }
}

@scoped(Lifecycle.ContainerScoped)
export class PlayerStorage extends StorageBase {
  constructor(@inject(PLAYER_TOKEN) player: Player) {
    super(player);
  }
}
