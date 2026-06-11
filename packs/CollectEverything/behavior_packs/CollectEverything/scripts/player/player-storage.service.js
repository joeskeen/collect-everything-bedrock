import { Player, World } from "@minecraft/server";
export class PlayerStorageService {
    world;
    player;
    constructor(di) {
        this.world = di.get(World);
        this.player = di.get(Player);
    }
    get(key) {
        const data = this.world.getDynamicProperty(`${this.player.id}:${key}`);
        return data ? JSON.parse(data) : undefined;
    }
    set(key, value) {
        const data = JSON.stringify(value);
        this.world.setDynamicProperty(`${this.player.id}:${key}`, data);
    }
}
