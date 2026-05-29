# Collect Everything - Outstanding Issues

## Entity Variant Detection

### Warm/Cold Variant Tracking
**Issue**: The determination of whether a farm animal (chicken, pig, cow, etc.) is a warm variant or cold variant is based on the biome in which the entity is **currently located** at the time of collection, not the biome in which it was originally **spawned**.

**Impact**: A warm-variant pig that wanders from a desert biome into a plains biome would be incorrectly identified as a normal pig when collected.

**Root Cause**: The Minecraft Bedrock API does not expose the `spawns_warm_variant_farm_animals` or `spawns_cold_variant_farm_animals` tags on entities themselves - these tags only exist on biomes. The warm/cold variant property is determined at spawn time based on the biome but is not persisted on the entity in any accessible way.

**Potential Fix**: If Mojang/Minecraft adds a persistent component or property to farm animals that stores the warm/cold variant state, we could update the entity collector to use that instead of inferring from the current biome.

**Affected Entities**:

At least the following farm animals have warm/cold variants that are currently determined by biome inference:

- Cow (`minecraft:cow`)
- Pig (`minecraft:pig`)
- Chicken (`minecraft:chicken`)
- Rabbit (`minecraft:rabbit`)
- Llama (`minecraft:llama`)
- Wolf (`minecraft:wolf`)

**Current Workaround**: Entity variants are inferred from the current biome using biome tags `spawns_warm_variant_farm_animals` and `spawns_cold_variant_farm_animals`.

## Structure Detection

**Issue**: There is no Minecraft Bedrock API to detect which structure a player is currently located in.

**Explored Approaches**:
1. `/locate` command - outputs to chat, requires cheats, not accessible from scripts
2. `StructureManager.getWorldStructureIds()` - only returns structures saved to world, not all possible structures, no position data
3. Block pattern detection (`/testforblock` at offsets) - rejected because:
   - Hardcoded offsets don't account for structure rotation/mirroring
   - Players could place signature blocks (e.g., cauldron for Witch Hut) and falsely trigger collection
   - Requires scanning many positions around player, performance concern
   - Unreliable and exploit-prone

**Conclusion**: Structure detection is not feasible with current Bedrock Script API. No reliable workaround exists without Mojang adding a new API to detect player structure membership.