import { vitest } from 'vitest';
import { Kinda } from 'kinda-type';
import type { World } from '@minecraft/server';

export function fakeWorld() {
  return {
    getPlayers: vitest.fn(),
  } as Kinda<World> as World;
}