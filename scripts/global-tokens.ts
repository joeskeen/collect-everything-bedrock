import type { Player, System, World } from "@minecraft/server";
import { InjectionToken } from "tsyringe";

export const SYSTEM_TOKEN: InjectionToken<System> = Symbol("global @minecraft/server `system`");
export const WORLD_TOKEN: InjectionToken<World> = Symbol("global @minecraft/server `world`");
export const PLAYER_TOKEN: InjectionToken<Player> = Symbol("current @minecraft/server `Player` in scope");
