#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$PROJECT_DIR/tools"
SRC_DIR="$PROJECT_DIR/src"
PACKS_DIR="$PROJECT_DIR/packs"
DATA_DIR="$PACKS_DIR/bp/data"
FUNCTIONS_DIR="$PACKS_DIR/bp/functions"
VERSION=$(node -e "const v=require('./src/bp/manifest.json').header.version; console.log(Array.isArray(v)?v.join('.'):v)")

echo "=== Collect Everything Build ==="
echo "Project: $PROJECT_DIR"

echo "[1/9] Cleaning old generated packs, dist, and manifest..."
rm -rf "$PACKS_DIR"
rm -rf "$PROJECT_DIR/dist"

echo "[2/9] Copying base behavior pack structure to stage..."
mkdir -p "$DATA_DIR"
mkdir -p "$FUNCTIONS_DIR"
mkdir -p "$PACKS_DIR/bp/scripts"
cp -r "$SRC_DIR/bp/"* "$PACKS_DIR/bp/"

echo "[3/9] Copying base resource pack structure to stage..."
mkdir -p "$PACKS_DIR/rp"
cp -r "$SRC_DIR/rp/"* "$PACKS_DIR/rp/"

echo "[4/9] Running enumerators..."
node "$TOOLS_DIR/enumerate_blocks.js"
node "$TOOLS_DIR/enumerate_items.js"
node "$TOOLS_DIR/enumerate_enchantments.js"
node "$TOOLS_DIR/enumerate_entities.js"
node "$TOOLS_DIR/enumerate_biomes.js"
node "$TOOLS_DIR/enumerate_effects.js"

echo "[5/9] Generating UI forms..."
node "$TOOLS_DIR/generate_forms.js"

echo "[6/9] Generating scoreboards..."
node "$TOOLS_DIR/generate_scoreboards.js"

echo "[7/9] Generating metrics..."
node "$TOOLS_DIR/compute_metrics.js"

echo "[8/9] Building scripts..."
npx tsc

echo "[9/9] Creating .mcaddon package..."
mkdir -p "$PROJECT_DIR/dist"
mkdir -p "$PACKS_DIR/CollectEverything/behavior_packs/CollectEverything"
mkdir -p "$PACKS_DIR/CollectEverything/resource_packs/CollectEverything"
cp -r "$PACKS_DIR/bp/"* "$PACKS_DIR/CollectEverything/behavior_packs/CollectEverything/"
cp -r "$PACKS_DIR/rp/"* "$PACKS_DIR/CollectEverything/resource_packs/CollectEverything/"
node -e "
const bp = require('./src/bp/manifest.json');
const rp = require('./src/rp/manifest.json');
const addonManifest = {
  format_version: 2,
  header: {
    name: bp.header.name,
    description: 'Add-on containing both behavior and resource packs',
    uuid: bp.header.uuid,
    version: bp.header.version,
    min_engine_version: bp.header.min_engine_version
  },
  modules: [
    bp.modules.find(m => m.type === 'data'),
    rp.modules.find(m => m.type === 'resources')
  ].filter(Boolean),
  dependencies: [
    { uuid: rp.header.uuid, version: rp.header.version }
  ]
};
const fs = require('fs');
fs.writeFileSync('$PACKS_DIR/CollectEverything/manifest.json', JSON.stringify(addonManifest, null, 2));
"
cd "$PACKS_DIR"
zip -r "$PROJECT_DIR/dist/CollectEverything_${VERSION}.mcaddon" CollectEverything
cd "$PROJECT_DIR"

echo ""
echo "=== Copying to test world ==="
if [ -L "$PROJECT_DIR/world" ]; then
    WORLD_DIR="$(readlink -f "$PROJECT_DIR/world")"
    rm -rf "$WORLD_DIR/behavior_packs/CollectEverything"
    rm -rf "$WORLD_DIR/resource_packs/CollectEverything"
    mkdir -p "$WORLD_DIR/behavior_packs/CollectEverything"
    mkdir -p "$WORLD_DIR/resource_packs/CollectEverything"
    cp -r "$PACKS_DIR/bp/"* "$WORLD_DIR/behavior_packs/CollectEverything/"
    cp -r "$PACKS_DIR/rp/"* "$WORLD_DIR/resource_packs/CollectEverything/"
    echo "Copied to: $WORLD_DIR/behavior_packs/CollectEverything"
elif [ -L "$PROJECT_DIR/world" ]; then
    echo "Error: world/ is a symlink but points to wrong target."
    echo "Current target: $(readlink $PROJECT_DIR/world)"
elif [ -d "$PROJECT_DIR/world" ]; then
    echo "Error: world/ is a directory (not a symlink to your world)."
    echo "Remove it and create the symlink correctly:"
    echo "  rm -rf world/"
    echo "  ln -s /home/joe/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang/minecraftWorlds/<WORLD_ID> world/"
else
    echo "Warning: world/ directory not found. Create the symlink:"
    echo "  ln -s /home/joe/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang/minecraftWorlds/<WORLD_ID> world/"
fi

echo ""
echo "=== Build complete ==="
echo "Restart the world or run /reload to see changes"