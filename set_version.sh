#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./set_version.sh <version>"
    echo "Example: ./set_version.sh 0.1.2"
    exit 1
fi

VERSION="$1"

# Convert version string to array format (e.g., "0.1.2" -> "0, 1, 2")
VERSION_ARRAY=$(echo "$VERSION" | sed 's/\./, /g')

echo "Setting version to $VERSION"

# Update bp manifest (string format: "0.1.2")
if [ -f "src/bp/manifest.json" ]; then
    sed -i "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/g" src/bp/manifest.json
    echo "Updated src/bp/manifest.json (string format)"
fi

# Update rp manifest (array format: [0, 1, 2])
if [ -f "src/rp/manifest.json" ]; then
    sed -i "s/\"version\": \[[0-9]*, [0-9]*, [0-9]*\]/\"version\": [$VERSION_ARRAY]/g" src/rp/manifest.json
    echo "Updated src/rp/manifest.json (array format)"
fi

echo "Done!"