import { describe, it, expect } from "vitest";
import entities from "./entities";
import { createVariantCounter } from "./entity-variants";
import { IdentifyEntity } from "./identify-entity";
import { createItemVariantCounter } from "../item/item-variants";
import items from "../item/items";

describe("entity variant system consistency", () => {
  const variantCounter = createVariantCounter();

  function getCombinedVariants(typeId: string): string[] {
    const result = new Set<string>();
    for (const diff of ["basic", "committed", "insane"] as const) {
      for (const v of variantCounter.enumerateEntityVariants(typeId, diff)) {
        result.add(v);
      }
    }
    return Array.from(result);
  }

  it("formatVariantValue uses entity data value for boolean variants", () => {
    const entries = Object.entries(entities as Record<string, { variants?: Record<string, unknown> }>);

    for (const [typeId, entityData] of entries) {
      if (!entityData.variants) continue;

      for (const [key, value] of Object.entries(entityData.variants)) {
        if (key.includes(",")) continue;
        if (typeof value !== "string") continue;
        if (!key.startsWith("c.")) continue;

        const componentName = key.slice(2);

        const mockEntity = {
          typeId,
          getComponent: (name: string) => {
            return name === `minecraft:${componentName}` ? { value: undefined } : null;
          },
          getProperty: () => undefined,
        };

        const identifyResults = IdentifyEntity(mockEntity as any);

        const expectedVariant = value as string;
        expect(identifyResults, `${typeId}: IdentifyEntity should include "${typeId}+${expectedVariant}"`).toContain(
          `${typeId}+${expectedVariant}`
        );

        const enumResults = variantCounter.enumerateEntityVariants(typeId, "insane");
        expect(
          enumResults,
          `${typeId}: enumerateEntityVariants should include "${typeId}+${expectedVariant}"`
        ).toContain(`${typeId}+${expectedVariant}`);
      }
    }
  });

  it("IdentifyEntity boolean output matches combined variant enumeration", () => {
    const entries = Object.entries(entities as Record<string, { variants?: Record<string, unknown> }>);

    for (const [typeId, entityData] of entries) {
      if (!entityData.variants) continue;

      for (const [key, value] of Object.entries(entityData.variants)) {
        if (key.includes(",")) continue;
        if (typeof value !== "string") continue;
        if (!key.startsWith("c.")) continue;

        const componentName = key.slice(2);

        const mockEntity = {
          typeId,
          getComponent: (name: string) => {
            return name === `minecraft:${componentName}` ? { value: undefined } : null;
          },
          getProperty: () => undefined,
        };

        const identifyResults = IdentifyEntity(mockEntity as any);
        const combined = getCombinedVariants(typeId);

        for (const result of identifyResults) {
          expect(
            combined,
            `${typeId}: IdentifyEntity produced "${result}" not in combined variant enumeration`
          ).toContain(result);
        }
      }
    }
  });

  it("IdentifyEntity object-variant output matches combined variant enumeration", () => {
    const entries = Object.entries(entities as Record<string, { variants?: Record<string, unknown> }>);

    for (const [typeId, entityData] of entries) {
      if (!entityData.variants) continue;

      for (const [key, value] of Object.entries(entityData.variants)) {
        if (key.includes(",")) continue;
        if (typeof value !== "object" || value === null) continue;
        if (!key.startsWith("c.")) continue;

        const componentName = key.slice(2);
        const lookup = value as Record<string, string>;

        for (const rawKey of Object.keys(lookup)) {
          if (rawKey === "undefined") continue;

          const mockEntity = {
            typeId,
            getComponent: (name: string) => {
              return name === `minecraft:${componentName}` ? { value: Number(rawKey) } : null;
            },
            getProperty: () => undefined,
          };

          const identifyResults = IdentifyEntity(mockEntity as any);
          const combined = getCombinedVariants(typeId);

          for (const result of identifyResults) {
            expect(
              combined,
              `${typeId}[${componentName}=${rawKey}]: IdentifyEntity produced "${result}" not in combined variant enumeration`
            ).toContain(result);
          }
        }
      }
    }
  });

  it("IdentifyEntity produces subset of combined enumeration for all entities", () => {
    const entries = Object.entries(
      entities as Record<string, { variants?: Record<string, unknown>; exclusions?: string[] }>
    );
    let tested = 0;

    for (const [typeId, entityData] of entries) {
      if (!entityData.variants) continue;

      const combined = getCombinedVariants(typeId);

      const mockComponents: Record<string, unknown> = {};
      const mockProperties: Record<string, unknown> = {};

      const excludedNegated: string[] = [];
      if (entityData.exclusions) {
        for (const ex of entityData.exclusions) {
          const m = ex.match(/^!((c\.\w+)|\w+)\+((c\.\w+)|\w+)$/);
          if (m) excludedNegated.push(m[1].replace(/^c\./, ""));
        }
      }

      for (const [key, value] of Object.entries(entityData.variants)) {
        if (key.includes(",")) continue;
        if (typeof value === "string" && key.startsWith("c.")) {
          const compName = key.slice(2);
          if (!excludedNegated.includes(compName)) {
            mockComponents[compName] = true;
          }
        } else if (typeof value === "object" && value !== null && key.startsWith("c.")) {
          const compName = key.slice(2);
          if (!excludedNegated.includes(compName)) {
            const firstKey = Object.keys(value).find((k) => k !== "undefined");
            if (firstKey !== undefined) {
              mockComponents[compName] = Number(firstKey);
            }
          }
        } else if (typeof value === "object" && value !== null && key.startsWith("p.")) {
          const firstKey = Object.keys(value).find((k) => k !== "undefined");
          if (firstKey !== undefined) {
            mockProperties[key.slice(2)] = firstKey;
          }
        }
      }

      if (Object.keys(mockComponents).length === 0 && Object.keys(mockProperties).length === 0) continue;

      const mockEntity = {
        typeId,
        getComponent: (name: string) => {
          const stripped = name.replace("minecraft:", "");
          return stripped in mockComponents ? { value: mockComponents[stripped] } : null;
        },
        getProperty: (name: string) => {
          const stripped = name.replace("minecraft:", "");
          return stripped in mockProperties ? mockProperties[stripped] : undefined;
        },
      };

      const identifyResults = IdentifyEntity(mockEntity as any);

      for (const result of identifyResults) {
        expect(
          combined,
          `${typeId}: IdentifyEntity with all variants active produced "${result}" not in combined variant enumeration`
        ).toContain(result);
      }
      tested++;
    }

    expect(tested).toBeGreaterThan(0);
  });
});

describe("item variant system consistency", () => {
  const itemCounter = createItemVariantCounter();

  it("enumerateItemVariants includes base item ID", () => {
    const variants = itemCounter.enumerateItemVariants("minecraft:bed");
    expect(variants).toContain("minecraft:bed");
  });

  it("enumerateItemVariants enumerates bed colors", () => {
    const variants = itemCounter.enumerateItemVariants("minecraft:bed");
    expect(variants).toContain("minecraft:bed+white");
    expect(variants).toContain("minecraft:bed+red");
    expect(variants).toContain("minecraft:bed+black");
  });

  it("enumerateItemVariants enumerates potion liquid types", () => {
    const variants = itemCounter.enumerateItemVariants("minecraft:potion");
    expect(variants).toContain("minecraft:potion+Consume");
    expect(variants).toContain("minecraft:potion+ThrownSplash");
    expect(variants).toContain("minecraft:potion+ThrownLingering");
  });

  it("enumerateItemVariants enumerates potion effect types", () => {
    const variants = itemCounter.enumerateItemVariants("minecraft:potion");
    expect(variants).toContain("minecraft:potion+minecraft:fire_resistance");
    expect(variants).toContain("minecraft:potion+minecraft:healing");
    expect(variants).toContain("minecraft:potion+minecraft:poison");
  });

  it("enumerateItemVariants produces individual and combined potion variants", () => {
    const variants = itemCounter.enumerateItemVariants("minecraft:potion");
    expect(variants).toContain("minecraft:potion+minecraft:fire_resistance");
    expect(variants).toContain("minecraft:potion+Consume");
    expect(variants).toContain("minecraft:potion+Consume+minecraft:fire_resistance");
  });

  it("enumerateItemVariants covers modifier variants (strong, long)", () => {
    const variants = itemCounter.enumerateItemVariants("minecraft:potion");
    expect(variants).toContain("minecraft:potion+minecraft:strong_regeneration");
    expect(variants).toContain("minecraft:potion+minecraft:long_regeneration");
    expect(variants).toContain("minecraft:potion+minecraft:strong_healing");
    expect(variants).toContain("minecraft:potion+minecraft:long_fire_resistance");
  });

  it("splash potion uses same effect IDs as regular potion", () => {
    const potion = itemCounter.enumerateItemVariants("minecraft:potion");
    const splash = itemCounter.enumerateItemVariants("minecraft:splash_potion");
    const lingering = itemCounter.enumerateItemVariants("minecraft:lingering_potion");

    const potionSingle = new Set(potion.map((v) => v.replace(/^minecraft:potion\+/, "")));
    const splashSingle = new Set(splash.map((v) => v.replace(/^minecraft:splash_potion\+/, "")));
    const lingeringSingle = new Set(lingering.map((v) => v.replace(/^minecraft:lingering_potion\+/, "")));

    expect(potionSingle.has("minecraft:fire_resistance")).toBe(true);
    expect(splashSingle.has("minecraft:fire_resistance")).toBe(true);
    expect(lingeringSingle.has("minecraft:fire_resistance")).toBe(true);
  });

  it("returns only base ID for unknown item", () => {
    expect(itemCounter.enumerateItemVariants("minecraft:unknown_item")).toEqual(["minecraft:unknown_item"]);
  });

  it("returns only base ID for item without variant data", () => {
    expect(itemCounter.enumerateItemVariants("minecraft:glass_bottle")).toEqual(["minecraft:glass_bottle"]);
  });

  it("potion effect keys are valid @minecraft/vanilla-data IDs", () => {
    const rawItems = items as unknown as Record<string, { variants?: Record<string, Record<string, string>> }>;
    const potionData = rawItems["minecraft:potion"];
    const effectKeys = Object.keys(potionData?.variants?.["c.potion_effect"] ?? {});
    expect(effectKeys.length).toBeGreaterThan(0);
    for (const key of effectKeys) {
      expect(key, `Potion effect key "${key}" should start with "minecraft:"`).toMatch(/^minecraft:/);
      expect(key, `Potion effect key "${key}" should have no spaces`).not.toMatch(/ /);
    }
  });
});
