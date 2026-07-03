import { describe, it, expect } from "vitest";
import { createVariantCounter } from "./entity-variants";

const emptyCounter = createVariantCounter({});

describe("countEntityVariants", () => {
  it("returns 0 for entity with no variants", () => {
    expect(emptyCounter.countEntityDataVariants({})).toBe(0);
    expect(emptyCounter.countEntityDataVariants({ name: "test" })).toBe(0);
  });

  it("counts boolean component variants as 2 states", () => {
    expect(
      emptyCounter.countEntityDataVariants({
        variants: { "c.is_baby": "baby" },
      })
    ).toBe(2);
  });

  it("multiplies counts for multiple variants", () => {
    expect(
      emptyCounter.countEntityDataVariants({
        variants: {
          "c.is_baby": "baby",
          "c.variant": { "0": "red", "1": "blue" },
        },
      })
    ).toBe(5);
  });

  it("multiplies counts for three variants", () => {
    expect(
      emptyCounter.countEntityDataVariants({
        variants: {
          "c.is_baby": "baby",
          "c.variant": { "0": "a", "1": "b", "2": "c" },
          "c.mark_variant": { "0": "x", "1": "y" },
        },
      })
    ).toBe(23);
  });

  it("subtracts impossible combinations from exclusions", () => {
    const data = {
      variants: {
        "c.is_baby": "baby",
        "c.variant": { "0": "a", "1": "b", "2": "c" },
      },
      exclusions: ["!c.is_baby+c.variant"],
    };
    const variants = emptyCounter.enumerateEntityDataVariants(data, "committed");
    expect(variants.length).toBe(4);
  });

  it("handles multiple exclusions", () => {
    const data = {
      variants: {
        "c.is_baby": "baby",
        "c.variant": { "0": "a", "1": "b" },
        "c.mark_variant": { "0": "x", "1": "y" },
      },
      exclusions: ["!c.is_baby+c.variant", "!c.is_baby+c.mark_variant"],
    };
    expect(emptyCounter.countEntityDataVariants(data, "committed")).toBe(5);
  });

  it("handles plains baby villager case", () => {
    expect(
      emptyCounter.countEntityDataVariants(
        {
          variants: {
            "c.variant": {
              "0": "unskilled",
              "1": "farmer",
              "2": "fisherman",
              "3": "shepherd",
              "4": "fletcher",
              "5": "librarian",
              "6": "cartographer",
              "7": "cleric",
              "8": "armorer",
              "9": "weaponsmith",
              "10": "toolsmith",
              "11": "butcher",
              "12": "leatherworker",
              "13": "mason",
              "14": "nitwit",
            },
            "c.mark_variant": {
              "0": "plains",
              "1": "desert",
              "2": "jungle",
              "3": "savannah",
              "4": "snowy",
              "5": "swamp",
              "6": "taiga",
              undefined: "plains",
            },
            "c.is_baby": "baby",
          },
          exclusions: ["!c.is_baby+c.variant"],
        },
        "committed"
      )
    ).toBe(23);
  });

  it("insane mode counts all valid combinations", () => {
    const data = {
      variants: {
        "c.variant": {
          "0": "unskilled",
          "1": "farmer",
          "2": "fisherman",
          "3": "shepherd",
          "4": "fletcher",
          "5": "librarian",
          "6": "cartographer",
          "7": "cleric",
          "8": "armorer",
          "9": "weaponsmith",
          "10": "toolsmith",
          "11": "butcher",
          "12": "leatherworker",
          "13": "mason",
          "14": "nitwit",
        },
        "c.mark_variant": {
          "0": "plains",
          "1": "desert",
          "2": "jungle",
          "3": "savannah",
          "4": "snowy",
          "5": "swamp",
          "6": "taiga",
        },
        "c.is_baby": "baby",
      },
      exclusions: ["!c.is_baby+c.variant"],
    };
    const count = emptyCounter.countEntityDataVariants(data, "insane");
    expect(count).toBe(135);
  });

  it("returns count when exclusion references non-existent variant", () => {
    expect(
      emptyCounter.countEntityDataVariants({
        variants: {
          "c.is_baby": "baby",
        },
        exclusions: ["!c.is_baby+c.nonexistent"],
      })
    ).toBe(2);
  });

  it("ignores compound variant keys (comma-separated)", () => {
    expect(
      emptyCounter.countEntityDataVariants({
        variants: {
          "c.is_baby": "baby",
          "c.variant,c.mark_variant": { "0,0": "combo1" },
        },
      })
    ).toBe(2);
  });

  it("looks up entity by id from passed-in entities map", () => {
    const testEntities = {
      "minecraft:villager_v2": {
        variants: {
          "c.is_baby": "baby",
          "c.variant": { "0": "a", "1": "b" },
        },
        exclusions: ["!c.is_baby+c.variant"],
      },
    };
    const customCounter = createVariantCounter(testEntities);
    expect(customCounter.countEntityVariants("minecraft:villager_v2")).toBe(4);
  });
});

describe("difficulty levels", () => {
  const villagerData = {
    variants: {
      "c.variant": { "0": "unskilled", "1": "farmer", "2": "librarian" },
      "c.mark_variant": { "0": "plains", "1": "desert" },
      "c.is_baby": "baby",
    },
    exclusions: ["!c.is_baby+c.variant"],
  };

  describe("basic difficulty", () => {
    it("returns 1 for any entity (just the entity type)", () => {
      expect(emptyCounter.countEntityDataVariants(villagerData, "basic")).toBe(1);
      expect(
        emptyCounter.countEntityDataVariants(
          {
            variants: {
              "c.is_baby": "baby",
              "c.variant": { "0": "a", "1": "b", "2": "c" },
            },
          },
          "basic"
        )
      ).toBe(1);
    });

    it("enumerates to single empty string", () => {
      expect(emptyCounter.enumerateEntityDataVariants(villagerData, "basic")).toEqual([""]);
    });
  });

  describe("committed difficulty", () => {
    it("counts unique variant values", () => {
      expect(emptyCounter.countEntityDataVariants(villagerData, "committed")).toBe(6);
    });

    it("enumerates each variant value individually", () => {
      const variants = emptyCounter.enumerateEntityDataVariants(villagerData, "committed");
      expect(variants).toContain("variant:0");
      expect(variants).toContain("variant:1");
      expect(variants).toContain("variant:2");
      expect(variants).toContain("mark_variant:0");
      expect(variants).toContain("mark_variant:1");
      expect(variants).toContain("baby");
    });

    it("excludes variants that are negated by exclusions", () => {
      const data = {
        variants: {
          "c.is_baby": "baby",
          "c.variant": { "0": "a", "1": "b" },
        },
        exclusions: ["!c.is_baby+c.variant"],
      };
      const variants = emptyCounter.enumerateEntityDataVariants(data, "committed");
      expect(variants).toContain("baby");
      expect(variants).toContain("variant:0");
      expect(variants).toContain("variant:1");
    });

    it("skips undefined variant values", () => {
      const data = {
        variants: {
          "c.mark_variant": {
            "0": "plains",
            "1": "desert",
            undefined: "plains",
          },
        },
      };
      const variants = emptyCounter.enumerateEntityDataVariants(data, "committed");
      expect(variants).toHaveLength(2);
      expect(variants).toContain("mark_variant:0");
      expect(variants).toContain("mark_variant:1");
      expect(variants).not.toContain("mark_variant:undefined");
    });
  });

  describe("insane difficulty (default)", () => {
    it("enumerates all valid combinations", () => {
      const variants = emptyCounter.enumerateEntityDataVariants(villagerData, "insane");
      expect(variants).toHaveLength(14);
    });

    it("excludes impossible combinations", () => {
      const variants = emptyCounter.enumerateEntityDataVariants(villagerData, "insane");
      expect(variants.every((v) => !v.includes("baby") || !v.match(/\bvariant:\d+/))).toBe(true);
    });
  });
});

describe("enumerateEntityVariants", () => {
  it("returns empty array for entity with no variants", () => {
    expect(emptyCounter.enumerateEntityDataVariants({})).toEqual([]);
  });

  it("enumerates all combinations", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.is_baby": "baby",
        "c.variant": { "0": "a", "1": "b" },
      },
    });
    expect(variants).toHaveLength(5);
    expect(variants).toContain("baby");
    expect(variants).toContain("baby+variant:0");
    expect(variants).toContain("baby+variant:1");
    expect(variants).toContain("variant:0");
    expect(variants).toContain("variant:1");
  });

  it("excludes impossible combinations (baby cannot have variant)", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.is_baby": "baby",
        "c.variant": { "0": "a", "1": "b" },
      },
      exclusions: ["!c.is_baby+c.variant"],
    });
    expect(variants).toHaveLength(3);
    expect(variants).toContain("variant:0");
    expect(variants).toContain("variant:1");
    expect(variants).toContain("baby");
    expect(variants).not.toContain("baby+variant:0");
    expect(variants).not.toContain("baby+variant:1");
  });

  it("enumerates villager case correctly (baby can have mark_variant but not variant)", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.variant": { "0": "a", "1": "b" },
        "c.mark_variant": { "0": "plains", "1": "desert" },
        "c.is_baby": "baby",
      },
      exclusions: ["!c.is_baby+c.variant"],
    });
    expect(variants).toHaveLength(11);
    const babyVariants = variants.filter((v) => v.includes("baby"));
    const adultVariants = variants.filter((v) => !v.includes("baby"));
    expect(babyVariants).toHaveLength(3);
    expect(adultVariants).toHaveLength(8);
    expect(babyVariants.every((v) => !v.match(/\bvariant:\d+/))).toBe(true);
  });

  it("returns base item id for unknown entity id", () => {
    expect(emptyCounter.enumerateEntityVariants("minecraft:unknown")).toEqual(["minecraft:unknown"]);
  });

  it("looks up entity by id from passed-in entities map", () => {
    const testEntities = {
      "minecraft:villager_v2": {
        variants: {
          "c.is_baby": "baby",
          "c.variant": { "0": "a", "1": "b" },
        },
        exclusions: ["!c.is_baby+c.variant"],
      },
    };
    const customCounter = createVariantCounter(testEntities);
    const variants = customCounter.enumerateEntityVariants("minecraft:villager_v2");
    expect(variants).toHaveLength(4);
    expect(variants).toContain("minecraft:villager_v2");
    expect(variants).toContain("minecraft:villager_v2+baby");
    expect(variants).toContain("minecraft:villager_v2+variant:0");
    expect(variants).toContain("minecraft:villager_v2+variant:1");
  });
});

describe("output format matches identifyEntity", () => {
  it("uses underscore format for variant keys (not c.variant)", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.variant": { "0": "red" },
      },
    });
    expect(variants).toContain("variant:0");
    expect(variants).not.toContain("c.variant:0");
  });

  it("uses underscore format for mark_variant keys (not c.mark_variant)", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.mark_variant": { "0": "plains" },
      },
    });
    expect(variants).toContain("mark_variant:0");
    expect(variants).not.toContain("c.mark_variant:0");
  });

  it("uses underscore format for climate_variant keys (not p.climate_variant)", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "p.climate_variant": { cold: "cold" },
      },
    });
    expect(variants).toContain("climate_variant:cold");
    expect(variants).not.toContain("p.climate_variant:cold");
  });

  it("outputs boolean true variants without :true suffix", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.is_baby": "baby",
      },
    });
    expect(variants).toContain("baby");
    expect(variants).not.toContain("is_baby:true");
    expect(variants).not.toContain("c.is_baby:true");
  });

  it("omits boolean false variants entirely", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.is_baby": "baby",
      },
    });
    expect(variants).not.toContain("baby:false");
    expect(variants).not.toContain("is_baby:false");
  });

  it("formats charged as standalone (no :true suffix)", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.is_charged": "charged",
      },
    });
    expect(variants).toContain("charged");
    expect(variants).not.toContain("charged:true");
  });

  it("formats sheared as standalone (no :true suffix)", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.is_sheared": "sheared",
      },
    });
    expect(variants).toContain("sheared");
    expect(variants).not.toContain("sheared:true");
  });

  it("combines variants with + separator", () => {
    const variants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.variant": { "0": "a" },
        "c.mark_variant": { "0": "x" },
      },
    });
    expect(variants).toContain("mark_variant:0+variant:0");
  });

  it("matches format from entity-name.spec.ts examples", () => {
    const axolotlVariants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.variant": { "0": "leucistic", "1": "cyan" },
      },
    });
    expect(axolotlVariants).toContain("variant:0");
    expect(axolotlVariants).toContain("variant:1");

    const horseVariants = emptyCounter.enumerateEntityDataVariants({
      variants: {
        "c.variant": { "0": "white" },
        "c.mark_variant": { "0": "no markings", "1": "white stockings" },
      },
    });
    expect(horseVariants).toContain("mark_variant:0+variant:0");
    expect(horseVariants).toContain("mark_variant:1+variant:0");
  });

  it("enumerateEntityVariants includes entity ID prefix matching identifyEntity format", () => {
    const testEntities = {
      "minecraft:axolotl": {
        variants: {
          "c.variant": { "0": "leucistic", "1": "cyan" },
        },
      },
    };
    const customCounter = createVariantCounter(testEntities);
    const variants = customCounter.enumerateEntityVariants("minecraft:axolotl");
    expect(variants).toContain("minecraft:axolotl+variant:0");
    expect(variants).toContain("minecraft:axolotl+variant:1");
  });
});
