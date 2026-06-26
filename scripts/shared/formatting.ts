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
