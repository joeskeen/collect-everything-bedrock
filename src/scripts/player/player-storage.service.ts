import { Player, World } from "@minecraft/server";
import { DiContainer } from "../shared/di.js";

export class PlayerStorageService {
  private readonly world: World;
  private readonly player: Player;

  constructor(di: DiContainer) {
    this.world = di.get(World);
    this.player = di.get(Player);
  }

  get<T>(key: string): T | undefined {
    const data = this.world.getDynamicProperty(
      `${this.player.id}:${key}`,
    ) as string;
    return data ? JSON.parse(data) : undefined;
  }

  set<T>(key: string, value: T) {
    const data = JSON.stringify(value);
    this.world.setDynamicProperty(`${this.player.id}:${key}`, data);
  }
}
