import { describe, it, expect, vi } from "vitest";
import { IdentifyEntity } from "./identify-entity";

vi.mock("../../data/entities", () => vi.importActual("../../data/entities"));

function createMockEntity(
  typeId: string,
  components: Record<string, unknown> = {},
  properties: Record<string, unknown> = {}
): unknown {
  const componentMap = new Map<string, unknown>();
  for (const [name, value] of Object.entries(components)) {
    componentMap.set(`minecraft:${name}`, { value });
  }

  const propertyMap = new Map<string, unknown>();
  for (const [name, value] of Object.entries(properties)) {
    propertyMap.set(`minecraft:${name}`, value);
  }

  return {
    typeId,
    getComponent: (name: string) => componentMap.get(name) ?? null,
    getProperty: (name: string) => propertyMap.get(name) ?? undefined,
  };
}

describe("IdentifyEntity", () => {
  describe("entity with no variants", () => {
    it("should return only the typeId for entity without variants", () => {
      const entity = createMockEntity("minecraft:bat");
      const result = IdentifyEntity(entity as any);

      expect(result).toEqual(["minecraft:bat"]);
    });

    it("should return only the typeId for entity not in entities data", () => {
      const entity = createMockEntity("minecraft:unknown_entity");
      const result = IdentifyEntity(entity as any);

      expect(result).toEqual(["minecraft:unknown_entity"]);
    });
  });

  describe("component variants (c.)", () => {
    it("should return variant when component exists due to code bug checking existence not value", () => {
      const entity = createMockEntity("minecraft:bee", { is_baby: false });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:bee+baby");
    });

    it("should return base typeId when component does not exist on entity", () => {
      const entity = createMockEntity("minecraft:bee");
      const result = IdentifyEntity(entity as any);

      expect(result).toEqual(["minecraft:bee"]);
    });

    it("should return variant string when boolean component is true", () => {
      const entity = createMockEntity("minecraft:bee", { is_baby: true });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:bee");
      expect(result).toContain("minecraft:bee+baby");
    });

    it("should return lookup value when component has object value", () => {
      const entity = createMockEntity("minecraft:axolotl", { variant: 0 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:axolotl");
      expect(result).toContain("minecraft:axolotl+variant:0");
    });

    it("should return unmapped variant value when component value has no lookup match", () => {
      const entity = createMockEntity("minecraft:axolotl", { variant: 99 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:axolotl");
      expect(result).toContain("minecraft:axolotl+variant:99");
    });

    it("should handle multiple component variants", () => {
      const entity = createMockEntity("minecraft:horse", { is_baby: true, variant: 1 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:horse");
      expect(result).toContain("minecraft:horse+baby");
      expect(result).toContain("minecraft:horse+variant:1");
    });
  });

  describe("property variants (p.)", () => {
    it("should return property variant when property matches", () => {
      const entity = createMockEntity("minecraft:frog", {}, { climate_variant: "cold" });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:frog");
      expect(result).toContain("minecraft:frog+climate_variant:cold");
    });

    it("should return base typeId when property does not exist", () => {
      const entity = createMockEntity("minecraft:frog", {}, {});
      const result = IdentifyEntity(entity as any);

      expect(result).toEqual(["minecraft:frog"]);
    });

    it("should return unmapped property variant when property value has no lookup match", () => {
      const entity = createMockEntity("minecraft:frog", {}, { climate_variant: "unknown" });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:frog");
      expect(result).toContain("minecraft:frog+climate_variant:unknown");
    });
  });

  describe("compound variants (comma-separated keys)", () => {
    it("should return 2-part compound variant as individual parts when components match", () => {
      const entity = createMockEntity("minecraft:tropicalfish", { variant: 0, mark_variant: 1 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:tropicalfish");
      expect(result).toContain("minecraft:tropicalfish+variant:0");
      expect(result).toContain("minecraft:tropicalfish+mark_variant:1");
      expect(result).toContain("minecraft:tropicalfish+mark_variant:1+variant:0");
    });

    it("should return base typeId when 2-part compound component is missing", () => {
      const entity = createMockEntity("minecraft:tropicalfish", { variant: 0 });
      const result = IdentifyEntity(entity as any);

      expect(result).toEqual(["minecraft:tropicalfish"]);
    });

    it("should handle horse with separate variant and mark_variant components", () => {
      const entity = createMockEntity("minecraft:horse", { variant: 1, mark_variant: 2 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:horse");
      expect(result).toContain("minecraft:horse+mark_variant:2");
      expect(result).toContain("minecraft:horse+variant:1");
      expect(result).toContain("minecraft:horse+mark_variant:2+variant:1");
    });

    it("should return villager with variant:0 but no mark_variant as plains", () => {
      const entity = createMockEntity("minecraft:villager_v2", { variant: 0 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:villager_v2");
      expect(result).toContain("minecraft:villager_v2+mark_variant:0+variant:0");
    });
  });

  describe("variant combinations", () => {
    it("should return single variant when only one active variant", () => {
      const entity = createMockEntity("minecraft:bee", { is_baby: true });
      const result = IdentifyEntity(entity as any);

      expect(result).toHaveLength(2);
      expect(result).toEqual(["minecraft:bee", "minecraft:bee+baby"]);
    });

    it("should return combinations of multiple active variants", () => {
      const entity = createMockEntity("minecraft:cow", { is_baby: true }, { climate_variant: "cold" });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:cow");
      expect(result).toContain("minecraft:cow+baby");
      expect(result).toContain("minecraft:cow+climate_variant:cold");
      expect(result).toContain("minecraft:cow+baby+climate_variant:cold");
    });

    it("should return all subset combinations", () => {
      const entity = createMockEntity("minecraft:sheep", { is_baby: true, is_sheared: true, color: 0 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:sheep");
      expect(result).toContain("minecraft:sheep+baby");
      expect(result).toContain("minecraft:sheep+color:0");
      expect(result).toContain("minecraft:sheep+sheared");
      expect(result).toContain("minecraft:sheep+baby+color:0");
      expect(result).toContain("minecraft:sheep+baby+sheared");
      expect(result).toContain("minecraft:sheep+color:0+sheared");
      expect(result).toContain("minecraft:sheep+baby+color:0+sheared");
    });

    it("should handle entity with component and compound variants", () => {
      const entity = createMockEntity("minecraft:horse", { is_baby: true, variant: 1, mark_variant: 2 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:horse");
      expect(result).toContain("minecraft:horse+baby");
      expect(result).toContain("minecraft:horse+mark_variant:2");
      expect(result).toContain("minecraft:horse+variant:1");
      expect(result).toContain("minecraft:horse+baby+mark_variant:2");
      expect(result).toContain("minecraft:horse+baby+variant:1");
      expect(result).toContain("minecraft:horse+mark_variant:2+variant:1");
      expect(result).toContain("minecraft:horse+baby+mark_variant:2+variant:1");
    });
  });

  describe("edge cases", () => {
    it("should handle entity with component that throws", () => {
      const throwingEntity = {
        typeId: "minecraft:axolotl",
        getComponent: () => {
          throw new Error("Component not found");
        },
        getProperty: () => undefined,
      };
      const result = IdentifyEntity(throwingEntity as any);

      expect(result).toEqual(["minecraft:axolotl"]);
    });

    it("should handle entity with property that throws", () => {
      const throwingEntity = {
        typeId: "minecraft:frog",
        getComponent: () => null,
        getProperty: () => {
          throw new Error("Property not found");
        },
      };
      const result = IdentifyEntity(throwingEntity as any);

      expect(result).toEqual(["minecraft:frog"]);
    });

    it("should handle entity with only base typeId when variant lookup is invalid", () => {
      const entity = createMockEntity("minecraft:copper_golem", {}, { some_property: "value" });
      const result = IdentifyEntity(entity as any);

      expect(result).toEqual(["minecraft:copper_golem"]);
    });

    it("should handle sulfur cube with variant and archetype", () => {
      const entity = createMockEntity("minecraft:sulfur_cube", { variant: 2 }, { sulfur_cube_archetype: "bouncy" });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:sulfur_cube");
      expect(result).toContain("minecraft:sulfur_cube+variant:2");
      expect(result).toContain("minecraft:sulfur_cube+sulfur_cube_archetype:bouncy");
    });
  });

  describe("real-world entity scenarios", () => {
    it("should identify a baby axolotl correctly", () => {
      const entity = createMockEntity("minecraft:axolotl", { is_baby: true, variant: 3 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:axolotl");
      expect(result).toContain("minecraft:axolotl+baby");
      expect(result).toContain("minecraft:axolotl+variant:3");
      expect(result).toContain("minecraft:axolotl+baby+variant:3");
    });

    it("should identify a charged creeper correctly", () => {
      const entity = createMockEntity("minecraft:creeper", { is_charged: true });
      const result = IdentifyEntity(entity as any);

      expect(result).toEqual(["minecraft:creeper", "minecraft:creeper+charged"]);
    });

    it("should identify a pillager captain correctly", () => {
      const entity = createMockEntity("minecraft:pillager", { is_illager_captain: true });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:pillager");
      expect(result).toContain("minecraft:pillager+captain");
      expect(result).toEqual(["minecraft:pillager", "minecraft:pillager+captain"]);
    });

    it("should identify a sheared sheep correctly", () => {
      const entity = createMockEntity("minecraft:sheep", { is_sheared: true, color: 4 });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:sheep");
      expect(result).toContain("minecraft:sheep+color:4");
      expect(result).toContain("minecraft:sheep+sheared");
      expect(result).toContain("minecraft:sheep+color:4+sheared");
    });

    it("should identify a baby cow in cold climate correctly", () => {
      const entity = createMockEntity("minecraft:cow", { is_baby: true }, { climate_variant: "cold" });
      const result = IdentifyEntity(entity as any);

      expect(result).toContain("minecraft:cow");
      expect(result).toContain("minecraft:cow+baby");
      expect(result).toContain("minecraft:cow+climate_variant:cold");
      expect(result).toContain("minecraft:cow+baby+climate_variant:cold");
    });
  });
});
