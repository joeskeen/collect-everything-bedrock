# Collect Everything! - Bedrock Add-On

<img src="./behavior_packs/collect-everything-bedrock/pack_icon.png" width="128" height="128" alt="Collect Everything Icon" />

A Minecraft Bedrock add-on that tracks your world exploration across multiple categories. Inspired by [Knarfy's Collect Everything](https://modrinth.com/mod/collect-everything) mod for Java Edition.

## Collection Browser

Access your collection visually through the built-in browser UI:

- **Checklist Item** — Use the `collecteverything:checklist` item in your inventory and click "View Collection" to open the browser
- **Categories** — Browse Items, Biomes, Entities, Effects, Enchantments, and Unobtainables
- **Progress Tracking** — See your collection progress with counts and percentages
- **Entity Variants** — View variant details based on your difficulty setting

## What Gets Tracked

- **Items** — picked up or equipped into inventory (crafting results tracked indirectly when they appear in inventory)
- **Entities** — mobs you kill, tame, leash, or name (variants depend on difficulty setting)
- **Biomes** — detected automatically as you explore
- **Enchantments** — on items currently in your inventory
- **Effects** — potion effects currently active on you
- **Unobtainables** — normally-unobtainable blocks you break (spawners, budding amethyst, chorus plant, trial_spawner, etc.)

## Difficulty Levels

Configure via `/collecteverything:settings`. This affects entity variant tracking:

- **Basic** — one of each entity type by Minecraft ID (e.g., just "horse")
- **Committed** — each variant type separately (e.g., each horse color and pattern individually)
- **Insane** — every valid variant combination (e.g., every horse color/pattern combo; includes 2000+ tropical fish combinations!)

## Commands

- `/collecteverything:stats` — view collection progress with counts/percentages
- `/collecteverything:all [filter]` — list all entries, highlighting collected ones
- `/collecteverything:collected` — list what you have collected
- `/collecteverything:uncollected` — list what you have not yet collected
- `/collecteverything:session` — show what you collected this session
- `/collecteverything:browse` — browse your collection via forms UI
- `/collecteverything:settings` — configure collection preferences

## Sponsor this add-on

Sponsors are credited in an upcoming easter-egg! [Sponsor this project](https://github.com/sponsors/joeskeen)
