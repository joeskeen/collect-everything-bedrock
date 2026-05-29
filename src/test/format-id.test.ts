import { describe, it, expect } from 'vitest';
import {
  formatItemId,
  formatBiomeId,
  formatEnchantmentId,
  formatEffectId,
  formatEntityId,
  formatCollectedId,
} from '../scripts/shared/format-id.js';

describe('formatItemId', () => {
  it('should format simple items', () => {
    expect(formatItemId('item:minecraft:diamond_sword')).toBe('Diamond Sword');
    expect(formatItemId('item:minecraft:chicken')).toBe('Chicken');
  });

  it('should handle items without minecraft prefix', () => {
    expect(formatItemId('item:chicken')).toBe('Chicken');
  });

  it('should format potions correctly', () => {
    expect(formatItemId('item:minecraft:potion:invisibility')).toBe('Potion of Invisibility');
    expect(formatItemId('item:minecraft:splash_potion:strength')).toBe('Splash Potion of Strength');
  });

  it('should handle potion suffixes', () => {
    expect(formatItemId('item:minecraft:potion:invisibility:long')).toBe('Potion of Invisibility (long)');
    expect(formatItemId('item:minecraft:splash_potion:strength:strong')).toBe('Splash Potion of Strength (strong)');
  });

  it('should handle leaf litter item', () => {
    expect(formatItemId('item:minecraft:leaf_litter')).toBe('Leaf Litter');
  });
});

describe('formatBiomeId', () => {
  it('should format simple biomes', () => {
    expect(formatBiomeId('biome:plains')).toBe('Plains');
    expect(formatBiomeId('biome:desert')).toBe('Desert');
  });

  it('should handle minecraft prefix', () => {
    expect(formatBiomeId('biome:minecraft:plains')).toBe('Plains');
  });

  it('should handle biome tags', () => {
    expect(formatBiomeId('biome:plains+tag1,tag2')).toBe('Plains');
  });
});

describe('formatEnchantmentId', () => {
  it('should format simple enchantments', () => {
    expect(formatEnchantmentId('enchantment:minecraft:sharpness')).toBe('Sharpness');
  });

  it('should format enchantments with level', () => {
    expect(formatEnchantmentId('enchantment:minecraft:sharpness:1')).toBe('Sharpness I');
    expect(formatEnchantmentId('enchantment:minecraft:sharpness:5')).toBe('Sharpness V');
  });

  it('should handle enchantments without minecraft prefix', () => {
    expect(formatEnchantmentId('enchantment:sharpness:3')).toBe('Sharpness III');
  });
});

describe('formatEffectId', () => {
  it('should format simple effects', () => {
    expect(formatEffectId('effect:minecraft:speed')).toBe('Speed');
  });

  it('should format effects with amplifier', () => {
    expect(formatEffectId('effect:minecraft:speed:0')).toBe('Speed I');
    expect(formatEffectId('effect:minecraft:speed:2')).toBe('Speed III');
  });

  it('should handle effects without minecraft prefix', () => {
    expect(formatEffectId('effect:speed:1')).toBe('Speed II');
  });
});

describe('formatEntityId', () => {
  it('should format simple entities', () => {
    expect(formatEntityId('entity:minecraft:chicken')).toBe('Chicken');
    expect(formatEntityId('entity:minecraft:zombie')).toBe('Zombie');
  });

  it('should format baby entities', () => {
    expect(formatEntityId('entity:minecraft:pig:baby')).toBe('Baby Pig');
  });

  it('should format warm variants', () => {
    expect(formatEntityId('entity:minecraft:pig:warm')).toBe('Warm Pig');
  });

  it('should format cold variants', () => {
    expect(formatEntityId('entity:minecraft:chicken:cold')).toBe('Cold Chicken');
  });

  it('should format entities with numeric variant', () => {
    expect(formatEntityId('entity:minecraft:cat:variant:1')).toBe('Cat Variant 1');
  });

  it('should format baby entities with numeric variant', () => {
    expect(formatEntityId('entity:minecraft:cat:variant:1:baby')).toBe('Baby Cat Variant 1');
  });

  it('should format villagers with biome', () => {
    expect(formatEntityId('entity:minecraft:villager:biome:desert')).toBe('Villager (Desert)');
  });
});

describe('formatCollectedId', () => {
  it('should route item IDs', () => {
    expect(formatCollectedId('item:minecraft:diamond')).toBe('Diamond');
  });

  it('should route biome IDs', () => {
    expect(formatCollectedId('biome:minecraft:desert')).toBe('Desert');
  });

  it('should route enchantment IDs', () => {
    expect(formatCollectedId('enchantment:minecraft:sharpness:2')).toBe('Sharpness II');
  });

  it('should route effect IDs', () => {
    expect(formatCollectedId('effect:minecraft:strength:1')).toBe('Strength II');
  });

  it('should route entity IDs', () => {
    expect(formatCollectedId('entity:minecraft:wolf')).toBe('Wolf');
  });
});