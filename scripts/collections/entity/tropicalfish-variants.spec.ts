import { describe, it, expect } from "vitest";
import { enumerateTropicalFishVariants, countTropicalFishVariants } from "./tropicalfish-variants";

const ENTITY_ID = "minecraft:tropicalfish";
const COLORS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"];
const SPECIES_KEYS = ["0,0", "0,1", "0,2", "0,3", "0,4", "0,5", "1,0", "1,1", "1,2", "1,3", "1,4", "1,5"];
const NAMED_KEYS = [
  "1,1,1,7",
  "1,0,7,7",
  "0,1,7,3",
  "0,4,0,7",
  "0,5,11,7",
  "0,0,1,0",
  "0,5,6,3",
  "1,3,10,4",
  "1,5,0,14",
  "0,5,0,4",
  "1,2,0,7",
  "1,5,0,1",
  "0,3,9,6",
  "0,4,5,3",
  "1,4,14,0",
  "0,2,7,14",
  "1,3,14,0",
  "1,0,0,4",
  "0,1,14,0",
  "0,5,7,0",
  "1,0,4,4",
  "0,3,9,4",
];
const YELLOWTAIL_PARROTFISH = "0,3,9,4";

describe("tropical fish variants", () => {
  describe("basic difficulty", () => {
    it("returns only the entity ID", () => {
      const result = enumerateTropicalFishVariants(ENTITY_ID, "basic");
      expect(result).toEqual([ENTITY_ID]);
    });
  });

  describe("committed difficulty", () => {
    const result = enumerateTropicalFishVariants(ENTITY_ID, "committed");

    it("counts 64 entries including base entity", () => {
      expect(result.length).toBe(64);
    });

    it("includes base entity", () => {
      expect(result).toContain(ENTITY_ID);
    });

    it("includes all 15 colors", () => {
      for (const c of COLORS) {
        expect(result).toContain(`${ENTITY_ID}+color:${c}`);
      }
    });

    it("includes all 15 color2 values", () => {
      for (const c2 of COLORS) {
        expect(result).toContain(`${ENTITY_ID}+color2:${c2}`);
      }
    });

    it("includes all 12 species entries", () => {
      for (const key of SPECIES_KEYS) {
        const [v, mv] = key.split(",");
        const parts = [`variant:${v}`, `mark_variant:${mv}`];
        parts.sort();
        expect(result).toContain(`${ENTITY_ID}+${parts.join("+")}`);
      }
    });

    it("includes 21 named variants", () => {
      const namedEntries = NAMED_KEYS.filter((k) => k !== YELLOWTAIL_PARROTFISH);
      expect(namedEntries.length).toBe(21);
      for (const key of namedEntries) {
        const [v, mv, c, c2] = key.split(",");
        const parts = [`variant:${v}`, `mark_variant:${mv}`, `color:${c}`, `color2:${c2}`];
        parts.sort();
        expect(result).toContain(`${ENTITY_ID}+${parts.join("+")}`);
      }
    });

    it("excludes yellowtail parrotfish from committed", () => {
      const [v, mv, c, c2] = YELLOWTAIL_PARROTFISH.split(",");
      const parts = [`variant:${v}`, `mark_variant:${mv}`, `color:${c}`, `color2:${c2}`];
      parts.sort();
      expect(result).not.toContain(`${ENTITY_ID}+${parts.join("+")}`);
    });

    it("count is correct via count function", () => {
      expect(countTropicalFishVariants(ENTITY_ID, "committed")).toBe(64);
    });
  });

  describe("insane difficulty", () => {
    const result = enumerateTropicalFishVariants(ENTITY_ID, "insane");

    it("includes base entity", () => {
      expect(result).toContain(ENTITY_ID);
    });

    it("includes all 2700 full species+color+color2 combinations", () => {
      for (const speciesKey of SPECIES_KEYS) {
        const [v, mv] = speciesKey.split(",");
        for (const c of COLORS) {
          for (const c2 of COLORS) {
            const parts = [`variant:${v}`, `mark_variant:${mv}`, `color:${c}`, `color2:${c2}`];
            parts.sort();
            const fullCombo = parts.join("+");
            expect(result).toContain(`${ENTITY_ID}+${fullCombo}`);
          }
        }
      }
    });

    it("includes yellowtail parrotfish variant", () => {
      const [v, mv, c, c2] = YELLOWTAIL_PARROTFISH.split(",");
      const parts = [`variant:${v}`, `mark_variant:${mv}`, `color:${c}`, `color2:${c2}`];
      parts.sort();
      expect(result).toContain(`${ENTITY_ID}+${parts.join("+")}`);
    });

    it("total count is 2701 (2700 combos + base entity)", () => {
      expect(result.length).toBe(2701);
    });
  });
});
