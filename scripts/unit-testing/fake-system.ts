import { vitest } from 'vitest';
import { Kinda } from 'kinda-type';
import type { System } from '@minecraft/server';

export function fakeSystem() {
  return {
    currentTick: undefined,
  } as Kinda<System> as System;
}
