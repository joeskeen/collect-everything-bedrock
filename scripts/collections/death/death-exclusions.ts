export const EXCLUDED_DAMAGE_CAUSES = [
  "charging",
  "campfire",
  "fallingBlock",
  "none",
  "override",
  "piston",
  "selfDestruct",
  "soulCampfire",
] as const;

export type ExcludedDamageCause = (typeof EXCLUDED_DAMAGE_CAUSES)[number];
