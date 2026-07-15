/*
 * Minecraft Bedrock Scripting API runs in a QuickJS environment, which
 * does not define setTimeout, clearTimeout, setInterval, clearInterval.
 * In order for RxJS to work in this environment, they must be defined
 * at the global scope. This uses Minecraft's runTimeout/runInterval
 * to polyfill the missing globals.
 */
import { system } from "@minecraft/server";

// Helper to convert RxJS milliseconds to Minecraft ticks (min 1 tick if time specified)
const msToTicks = (ms: number) => {
  if (!ms || ms < 0) return 0;
  return Math.max(1, Math.round(ms / 50));
};

// Polyfill standard timers using Minecraft's scheduling system
// Explicitly isolate the callback invocation to prevent arguments leakage to system commands
globalThis.setTimeout = ((callback: Function, delay: number, ...args: any[]) => {
  return system.runTimeout(() => {
    callback(...args);
  }, msToTicks(delay));
}) as any;

globalThis.setInterval = ((callback: Function, delay: number, ...args: any[]) => {
  return system.runInterval(() => {
    callback(...args);
  }, msToTicks(delay));
}) as any;

globalThis.clearTimeout = ((id: number) => {
  if (id !== undefined) system.clearRun(id);
}) as any;

globalThis.clearInterval = ((id: number) => {
  if (id !== undefined) system.clearRun(id);
}) as any;
