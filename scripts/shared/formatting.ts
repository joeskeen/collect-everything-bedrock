import { capitalCase } from "change-case";
import { PERCENT_SYMBOL } from "./format-codes";

export function trimNamespace(what: string): string {
  return what.replace(/^[^:]+:/, "");
}

export function formatId(what: string): string {
  return capitalCase(trimNamespace(what));
}

export function percent(numerator: number, denominator: number, encodePercent = true): string {
  return `${Math.floor((numerator / denominator) * 100)}${encodePercent ? PERCENT_SYMBOL : "%"}`;
}

const ROMAN_VALUES = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
const ROMAN_NUMERALS = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];

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
