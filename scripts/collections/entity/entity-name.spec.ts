import { describe, it, expect, vi } from "vitest";
import { getEntityDisplayName } from "./entity-name";

vi.mock("../../data/entities", () => vi.importActual("../../data/entities"));

describe("getEntityDisplayName", () => {
  describe("base entity names", () => {
    it("should return the formatted id when entity has no name property", () => {
      const result = getEntityDisplayName("minecraft:bat");
      expect(result).toBe("Bat");
    });

    it("should return the name property when entity has one", () => {
      const result = getEntityDisplayName("minecraft:tropicalfish");
      expect(result).toBe("Tropical Fish");
    });

    it("should return the name property for zombie villager", () => {
      const result = getEntityDisplayName("minecraft:zombie_villager_v2");
      expect(result).toBe("Zombie Villager");
    });
  });

  describe("entity with variants", () => {
    it("should return name with variant in parentheses", () => {
      const result = getEntityDisplayName("minecraft:axolotl+variant:0");
      expect(result).toBe("Axolotl (Leucistic)");
    });

    it("should return name with multiple variants separated by comma", () => {
      const result = getEntityDisplayName("minecraft:horse+mark_variant:2+variant:1");
      expect(result).toBe("Horse (Creamy, White Field)");
    });

    it("should return name with boolean variant (no value suffix)", () => {
      const result = getEntityDisplayName("minecraft:bee+baby");
      expect(result).toBe("Bee (Baby)");
    });

    it("should return name with climate_variant property", () => {
      const result = getEntityDisplayName("minecraft:frog+climate_variant:cold");
      expect(result).toBe("Frog (Cold)");
    });
  });

  describe("entity with compound variants", () => {
    it("should return name with compound variant display value", () => {
      const result = getEntityDisplayName("minecraft:tropicalfish+color:7+color2:3+mark_variant:1+variant:0");
      expect(result).toBe("Tropical Fish (Blue Dory)");
    });

    it("should return name with 2-part compound variant", () => {
      const result = getEntityDisplayName("minecraft:tropicalfish+mark_variant:0+variant:1");
      expect(result).toBe("Tropical Fish (Flopper)");
    });

    it("should return name with 4-part compound variant (insane format)", () => {
      const result = getEntityDisplayName("minecraft:tropicalfish+color:7+color2:4+mark_variant:0+variant:1");
      expect(result).toBe("Tropical Fish (Gray-Yellow Flopper)");
    });

    it("should return name with same colors collapsed (insane format)", () => {
      const result = getEntityDisplayName("minecraft:tropicalfish+color:4+color2:4+mark_variant:0+variant:0");
      expect(result).toBe("Tropical Fish (Yellow Kob)");
    });

    it("should return name with color-only base color suffix", () => {
      const result = getEntityDisplayName("minecraft:tropicalfish+color:7");
      expect(result).toBe("Tropical Fish (Gray base color)");
    });

    it("should return name with color2-only pattern color suffix", () => {
      const result = getEntityDisplayName("minecraft:tropicalfish+color2:4");
      expect(result).toBe("Tropical Fish (Yellow pattern color)");
    });
  });

  describe("edge cases", () => {
    it("should return formatted id when variant has no mapping", () => {
      const result = getEntityDisplayName("minecraft:axolotl+variant:99");
      expect(result).toBe("Axolotl (Variant 99)");
    });

    it("should return base name when variant key is not found", () => {
      const result = getEntityDisplayName("minecraft:bat+some_unknown:1");
      expect(result).toBe("Bat (Some Unknown 1)");
    });

    it("should return name with valid variants even when some are invalid", () => {
      const result = getEntityDisplayName("minecraft:axolotl+unknown:1+variant:0");
      expect(result).toBe("Axolotl (Leucistic, Unknown 1)");
    });

    it("should handle entity with only boolean variant", () => {
      const result = getEntityDisplayName("minecraft:creeper+charged");
      expect(result).toBe("Creeper (Charged)");
    });

    it("should handle sheep with color variant", () => {
      const result = getEntityDisplayName("minecraft:sheep+color:0");
      expect(result).toBe("Sheep (White)");
    });

    it("should handle sheared sheep with color variant", () => {
      const result = getEntityDisplayName("minecraft:sheep+color:0+sheared");
      expect(result).toBe("Sheep (Sheared, White)");
    });
  });
});
