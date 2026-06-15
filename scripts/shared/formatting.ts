import { capitalCase } from "change-case";
import { PERCENT_SYMBOL } from "./format-codes";

export function trimId(what: string): string {
  return what.replace(/^minecraft:/, "");
}

export function formatId(what: string): string {
  return capitalCase(trimId(what));
}

export function percent(numerator: number, denominator: number): string {
  return `${Math.floor((numerator / denominator) * 100)}${PERCENT_SYMBOL}`;
}
