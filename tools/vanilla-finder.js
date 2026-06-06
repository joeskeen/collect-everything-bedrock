import { existsSync, readdirSync } from "fs";
import { join } from "path";

export function findVanillaPath() {
  return findVanillaRPPath();
}

export function findLootTablesPath() {
  const bpPath = findVanillaBPPath();
  const lootTablesPath = join(bpPath, "loot_tables");
  if (!existsSync(lootTablesPath)) {
    throw new Error(
      `Loot tables directory not found at ${lootTablesPath}. Please ensure the vanilla behavior pack is valid.`,
    );
  }
  return lootTablesPath;
}

export function findVanillaBPPath() {
  if (process.env.VANILLA_BP) {
    return process.env.VANILLA_BP;
  }
  const basePath = join(
    process.env.HOME,
    ".var/app/io.mrarm.mcpelauncher/data/mcpelauncher/"
  );
  if (!existsSync(basePath)) {
    throw new Error(
      "Vanilla BP not found. Please set the VANILLA_BP environment variable to the path of the vanilla behavior pack, or install the FlatPak version of McpeLauncher in the user scope.",
    );
  }
  const versions = readdirSync(join(basePath, "versions")).filter((name) =>
    /^1\.\d+\.\d+\.\d+$/.test(name),
  );
  if (versions.length === 0) {
    throw new Error(
      "No Minecraft versions found in McpeLauncher data. Please ensure you have at least one version of Minecraft installed.",
    );
  }
  versions.sort((a, b) => {
    const [aMajor, aMinor, aPatch, aBuild] = a.split(".").map(Number);
    const [bMajor, bMinor, bPatch, bBuild] = b.split(".").map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    if (aPatch !== bPatch) return bPatch - aPatch;
    return bBuild - aBuild;
  });
  const latestVersion = versions[0];
  const versionsPath = join(basePath, "versions", latestVersion, "assets", "assets", "behavior_packs");
  const bpPath = findLatestVanillaBP(versionsPath);
  if (!bpPath) {
    throw new Error(
      `Vanilla BP not found in the latest Minecraft version (${latestVersion}). Please ensure the vanilla behavior pack is present.`,
    );
  }
  return bpPath;
}

function findLatestVanillaBP(versionsPath) {
  if (!existsSync(versionsPath)) return null;
  const packs = readdirSync(versionsPath).filter((name) => name.startsWith("vanilla_"));
  if (packs.length === 0) return null;
  packs.sort((a, b) => {
    const verA = a.replace("vanilla_", "").split(".").map(Number);
    const verB = b.replace("vanilla_", "").split(".").map(Number);
    for (let i = 0; i < verA.length; i++) {
      if (verA[i] !== verB[i]) return verB[i] - verA[i];
    }
    return 0;
  });
  const bpPath = join(versionsPath, packs[0]);
  if (!existsSync(join(bpPath, "item_catalog", "crafting_item_catalog.json"))) {
    return null;
  }
  return bpPath;
}

export function findVanillaRPPath() {
  if (process.env.VANILLA_RP) {
    return process.env.VANILLA_RP;
  }
  const basePath = join(
    process.env.HOME,
    ".var/app/io.mrarm.mcpelauncher/data/mcpelauncher/"
  );
  if (!existsSync(basePath)) {
    throw new Error(
      "Vanilla RP not found. Please set the VANILLA_RP environment variable to the path of the vanilla resource pack, or install the FlatPak version of McpeLauncher in the user scope.",
    );
  }
  const versions = readdirSync(join(basePath, "versions")).filter((name) =>
    /^1\.\d+\.\d+\.\d+$/.test(name),
  );
  if (versions.length === 0) {
    throw new Error(
      "No Minecraft versions found in McpeLauncher data. Please ensure you have at least one version of Minecraft installed.",
    );
  }
  versions.sort((a, b) => {
    const [aMajor, aMinor, aPatch, aBuild] = a.split(".").map(Number);
    const [bMajor, bMinor, bPatch, bBuild] = b.split(".").map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    if (aPatch !== bPatch) return bPatch - aPatch;
    return bBuild - aBuild;
  });
  const latestVersion = versions[0];
  const vanillaPath = join(
    basePath,
    "versions",
    latestVersion,
    "assets",
    "assets",
    "resource_packs",
    "vanilla",
  );
  if (!existsSync(vanillaPath)) {
    throw new Error(
      `Vanilla RP not found in the latest Minecraft version (${latestVersion}). Please ensure the vanilla resource pack is present in the expected location.`,
    );
  }
  return vanillaPath;
}

export function findLootTablePaths() {
  const lootTablesPath = findLootTablesPath();
  const paths = [];

  function walkDir(dir, prefix = "") {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith(".json")) {
        const tableName = entry.name.replace(".json", "");
        const path = prefix ? `${prefix}/${tableName}` : tableName;
        paths.push(path);
      }
    }
  }

  walkDir(lootTablesPath);
  return paths;
}