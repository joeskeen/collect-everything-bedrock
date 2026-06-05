import type { System, World } from "@minecraft/server";
import { InjectionToken } from "tsyringe";

export const SYSTEM_TOKEN: InjectionToken<System> = Symbol();
export const WORLD_TOKEN: InjectionToken<World> = Symbol();
