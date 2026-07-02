# Architecture

## Tech Stack

- Node.js (build tools)
- Bedrock Script API 2.8.0 / @minecraft/server-ui 2.1.0 (runtime logic)
- TypeScript (source)
- JSON (data/registries, forms)
- Vanilla resource/behavior packs (enumeration source)

## Developer Setup

### Prerequisites

- **MCPE Launcher must be installed via Flatpak (user-scoped)** — The build tools resolve paths to the vanilla resource packs from `~/.var/app/io.mrarm.mcpelauncher/`. If installed system-wide or via other methods, the enumerators will fall back to sample data instead of the full registry.

### 1. Link Your Test World

```bash
ln -s ~/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang/minecraftWorlds/<WORLD_ID> world/development_test_world
```

### 2. Build

```bash
npm run build
```

### 3. Create .mcaddon (optional)

```bash
npm run mcaddon
```

### 4. Test

1. Open MCPE Launcher
2. Load your test world
3. Run `/reload`

## Entity Tracking Details

### How Variants Work

Entity variants are tracked via:

- **Components** — entity components like `is_baby`, `variant`, `is_tamed`, `is_sheared`, `charged`, etc.
- **Properties** — entity properties like `climate_variant`, `oxidation_level`, `is_waxed`, etc.

### Difficulty Levels

The difficulty setting affects how entity variants are enumerated and counted:

- **Basic** — only the base entity ID is tracked (no variants)
- **Committed** — each variant value is tracked independently (e.g., "horse+color:brown" and "horse+pattern:spotted" separately)
- **Insane** — every valid combination of variants is tracked (e.g., "horse+color:brown+pattern:spotted")

### Special Cases

- **Villagers** — tracked with their biome
- **Baby mobs** — tracked separately from adults
- **Tamed/Leashed/Named mobs** — tracked when you interact with them using the appropriate item (name_tag, lead)
- **Ender Dragon** — any nearby player gets credit when it dies (not just the killer)
- **Warm/Cold variants** — farm animal variants detected via biome tags

## Thanks and Acknowledgments

- Knarfy: thanks for the idea, the Java add-on, and the awesome video series!
- Herobrine643928: thanks for making Chest-UI, as this was my starting point for the graphical Collection Browser!
- Smell of Curry: thanks for the tutorial videos and Smelly API code!
- Minecraft Bedrock team: thanks for making extensibility possible on MCBE!
