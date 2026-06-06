import type { Player, System, World } from "@minecraft/server";
import { InjectionToken } from "tsyringe";

export const SYSTEM_TOKEN: InjectionToken<System> = Symbol("global @minecraft/server `system`");
export const WORLD_TOKEN: InjectionToken<World> = Symbol("global @minecraft/server `world`");
export const PLAYER_TOKEN: InjectionToken<Player> = Symbol("current @minecraft/server `Player` in scope");

export type PlayerSession = { startTick: number };
export const PLAYER_SESSION_TOKEN: InjectionToken<PlayerSession> = Symbol(
  "information about the player's current session"
);
