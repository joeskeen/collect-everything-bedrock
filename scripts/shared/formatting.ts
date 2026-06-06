import { capitalCase } from "change-case";

export function formatId(what: string): string {
  return capitalCase(what.replace(/^minecraft:/, ""));
}
