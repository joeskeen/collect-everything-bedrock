# Collect Everything

A Minecraft Bedrock Add-On that tracks player exploration progress.

## What It Tracks

- **Blocks** - collected when placed
- **Entities** - collected when attacked
- **Biomes** - collected when entered (via `dimension.getBiome`)
- **Structures** - not yet implemented
- **Effects** - not yet implemented
- **Enchantments** - not yet implemented
- **Armor** - not yet implemented

## Build & Deploy

```bash
./build.sh
```

Deploys to `world/behavior_packs/CollectEverything` (symlink to MCPELauncher test world).

## Commands

- `/collecteverything:stats` - Show collection progress (blocks, entities, biomes with %)
- `/collecteverything:reset` - Clear all collection progress (Admin permission)

## Build Pipeline (build.sh)

1. Bundle scripts with esbuild
2. Copy BP/RP base structure
3. Enumerate vanilla data (blocks, entities, biomes)
4. Generate collection books (96/54/30 pages)
5. Generate UI forms (main browser, settings)
6. Generate scoreboard definitions
7. Copy to test world

### Enumeration Data

Located at `packs/BP/data/`:
- `registry_blocks.json` - 341 blocks
- `registry_entities.json` - 143 entities
- `registry_biomes.json` - 64 biomes
- `scoreboard_init.json` - 548 scoreboard entries

### Working Features

- Script loads and runs in Bedrock 1.26.13 (using `@minecraft/server` 2.1.0+)
- Custom commands via `customCommandRegistry` (`stats`, `reset`)
- Block tracking via `world.afterEvents.playerBreakBlock` / `world.afterEvents.playerPlaceBlock`
- Entity tracking via `world.afterEvents.entityHitEntity`
- Biome detection via `dimension.getBiome(player.location)`
- Biome detection runs immediately on player spawn (not just every 40 ticks)
- Scoreboard tracking per player (collect_blocks, collect_entities, collect_biomes)
- Actionbar notifications for new discoveries
- Data persistence via `world.setDynamicProperty` / `world.getDynamicProperty`
- esbuild bundling with ESM format + external `@minecraft/server`

### Known Limitations / Issues

1. **Chat commands removed** - `world.beforeEvents.chatSend` is pre-release/experimental. Instead use <https://wiki.bedrock.dev/scripting/custom-commands>
2. Not showing collection of biome when player is spawned into the world - **FIXED: now runs checkBiome on spawn with 10-tick delay**
3. **No data persistence** - collection state lost on world reload - **FIXED: now persists via dynamic properties**
4. **Biome check runs every 40 ticks** - could be optimized - **FIXED: now only checks on spawn and periodically (100 tick grace period after spawn)**
5. **No structure detection** - needs implementation
6. blocks not collected when broken or held in inventory, only when placed
7. entities not collected when interacted with, only when hit. Should add naming, trading, breeding, leashing, etc.
8. Only collects the base block/entity/biome types, not variants (e.g. horse types, fish types, biome subtypes, villager professions, etc.)

### TODO

- [ ] UI Browser - Forms/custom UI to browse collection progress
- [ ] Settings Form - Toggle options (horse variants, fish variants, etc.)
- [ ] Collection Books - Give players actual in-game books
- [ ] Structure Detection - Detect villages, temples, monuments, etc.
- [x] Data Persistence - Use dynamic properties to save collection state
- [x] Custom Commands - Stats and reset commands via customCommandRegistry
- [ ] Wire up generated forms to chat commands

## Technical Notes

### esbuild Configuration

```javascript
{
    entryPoints: ['src/scripts/main_entry.mjs'],
    bundle: true,
    outfile: 'src/scripts/main.js',
    format: 'esm',
    platform: 'neutral',
    external: ['@minecraft/server', '@minecraft/server-ui']
}
```

### API Compatibility

The script uses `@minecraft/server` 2.1.0+ APIs:
- `world.afterEvents.worldLoad` (not `worldInitialize`)
- `world.afterEvents.playerSpawn`
- `world.afterEvents.playerBreakBlock` / `playerPlaceBlock`
- `world.afterEvents.entityHitEntity`
- `dimension.getBiome(location)` - returns `BiomeType`
- `system.runInterval()` / `system.runTimeout()`
- `system.beforeEvents.startup` - for `customCommandRegistry`
- `world.setDynamicProperty` / `world.getDynamicProperty` - for persistence

### Custom Commands

Registered via `system.beforeEvents.startup` with `{ customCommandRegistry }`:
- `collecteverything:stats` - Any permission, shows collection progress
- `collecteverything:reset` - Admin permission, clears all progress

### File Paths (MCPE Launcher Flatpak)

- Vanilla RP: `~/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/versions/1.26.13.1/assets/assets/resource_packs/vanilla`
- Test world: `~/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang/minecraftWorlds/-aoiSJdTI3o=/`