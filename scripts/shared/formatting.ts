import { PERCENT_SYMBOL } from "./format-codes";

export function trimNamespace(what: string): string {
  return what.replace(/^[^:]+:/, "");
}

export function capitalCase(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function formatId(what: string): string {
  return capitalCase(trimNamespace(what));
}

export function percent(numerator: number, denominator: number, encodePercent = true): string {
  return `${Math.floor((numerator / denominator) * 100)}${encodePercent ? PERCENT_SYMBOL : "%"}`;
}

const ROMAN_VALUES = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
const ROMAN_NUMERALS = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];

export const TICKS_PER_DAY = 24000;

export function timeAgo(tick: number, currentTick: number): string {
  const diffTicks = currentTick - tick;
  const seconds = Math.floor(diffTicks / 20);
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
}

export function collectionDay(tick: number): number {
  return Math.floor(tick / TICKS_PER_DAY);
}

export function toRoman(n: number): string {
  if (n <= 0) return `${n}`;
  let remaining = n;
  let result = "";
  for (let i = 0; i < ROMAN_VALUES.length; i++) {
    while (remaining >= ROMAN_VALUES[i]) {
      result += ROMAN_NUMERALS[i];
      remaining -= ROMAN_VALUES[i];
    }
  }
  return result;
}
