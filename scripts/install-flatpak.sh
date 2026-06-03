#!/bin/bash

set -e

FLATPAK_BASE="$HOME/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKS_DIR="$SCRIPT_DIR/../packs"
BP_SRC="$PACKS_DIR/bp"
RP_SRC="$PACKS_DIR/rp"
VERSION="0.1.2"
BP_DEST="$FLATPAK_BASE/behavior_packs/CollectEverything_$VERSION"
RP_DEST="$FLATPAK_BASE/resource_packs/CollectEverything_$VERSION"

install_pack() {
    local src=$1
    local dest=$2
    local name=$3

    if [ ! -d "$src" ]; then
        echo "Error: Source $src does not exist"
        exit 1
    fi

    if [ -d "$dest" ]; then
        echo "Removing existing installation of $name..."
        rm -rf "$dest"
    fi

    echo "Installing $name to $dest"
    cp -r "$src" "$dest"
    echo "Successfully installed $name"
}

mkdir -p "$FLATPAK_BASE/behavior_packs"
mkdir -p "$FLATPAK_BASE/resource_packs"

install_pack "$BP_SRC" "$BP_DEST" "Collect Everything (Behavior Pack)"
install_pack "$RP_SRC" "$RP_DEST" "Collect Everything (Resource Pack)"

echo ""
echo "Installation complete! Enable both packs in Minecraft via:"
echo "  Behavior Packs > Collect Everything!"
echo "  Resource Packs > Collect Everything Resource Pack"