import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";

const __dirname = join(fileURLToPath(import.meta.url), "..");
const CACHE_DIR = join(__dirname, ".vanilla_cache");
const BP_EXTRACT_DIR = join(CACHE_DIR, "vanilla_bp");
const RP_EXTRACT_DIR = join(CACHE_DIR, "vanilla_rp");
const ARCHIVE_PATH = join(CACHE_DIR, "vanilla_packs.tar.gz");

export const BP_EXTRACTED_DIR = BP_EXTRACT_DIR;
export const RP_EXTRACTED_DIR = RP_EXTRACT_DIR;

export function getVanillaCacheDir() {
  return CACHE_DIR;
}

export async function downloadVanillaPack(url, destPath) {
  console.log(`[download] Downloading ${url}...`);
  console.log(`[download] This may take a moment on first run.`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, buffer);
  console.log(`[download] Saved to ${destPath} (${buffer.length} bytes)`);
  return destPath;
}

export async function ensureVanillaPacks(forceDownload = false) {
  mkdirSync(CACHE_DIR, { recursive: true });

  const bpItemsPath = join(BP_EXTRACT_DIR, "item_catalog", "crafting_item_catalog.json");
  const rpBlocksPath = join(RP_EXTRACT_DIR, "blocks.json");

  if (!forceDownload) {
    if (existsSync(bpItemsPath) && existsSync(rpBlocksPath)) {
      console.log("[vanilla] Using cached vanilla packs");
      return { bpPath: BP_EXTRACT_DIR, rpPath: RP_EXTRACT_DIR };
    }
  }

  // Download the archive from GitHub
  const ARCHIVE_URL = "https://api.github.com/repos/ZtechNetwork/MCBVanillaResourcePack/tarball/master";
  if (forceDownload || !existsSync(ARCHIVE_PATH)) {
    await downloadVanillaPack(ARCHIVE_URL, ARCHIVE_PATH);
  } else {
    console.log("[vanilla] Using cached archive");
  }

  // Extract both packs
  await extractVanillaPacks(ARCHIVE_PATH);

  return { bpPath: BP_EXTRACT_DIR, rpPath: RP_EXTRACT_DIR };
}

export async function extractVanillaPacks(archivePath) {
  console.log(`[extract] Extracting vanilla packs from ${archivePath}...`);
  const { execSync } = await import("child_process");

  const tempExtract = join(CACHE_DIR, "temp_extract");
  try { rmSync(tempExtract, { recursive: true }); } catch {}
  mkdirSync(tempExtract, { recursive: true });

  console.log("[extract] Extracting tarball...");
  execSync(`tar -xzf "${archivePath}" -C "${tempExtract}"`, { encoding: "utf-8" });

  // The structure is: tempExtract/bedrock-dot-dev-packs-HASH/stable/behavior/...
  const entries = readdirSync(tempExtract);
  let baseDir = null;
  for (const entry of entries) {
    if (entry.startsWith("packs")) {
      baseDir = join(tempExtract, entry);
      break;
    }
  }

  if (!baseDir) {
    // Fallback: try stripping components
    console.log("[extract] Standard extraction failed, trying with strip-components...");
    rmSync(tempExtract, { recursive: true });
    mkdirSync(tempExtract, { recursive: true });
    execSync(`tar -xzf "${archivePath}" --strip-components=1 -C "${tempExtract}"`, { encoding: "utf-8" });
    const newEntries = readdirSync(tempExtract);
    for (const entry of newEntries) {
      if (entry.startsWith("packs")) {
        baseDir = join(tempExtract, entry);
        break;
      }
    }
  }

  // Now baseDir points to bedrock-dot-dev-packs-HASH
  // We want stable/behavior and stable/resource
  const stableBehaviorPath = baseDir ? join(baseDir, "stable", "behavior") : null;
  const stableResourcePath = baseDir ? join(baseDir, "stable", "resource") : null;

  // Clean up extraction dirs first
  try { rmSync(BP_EXTRACT_DIR, { recursive: true }); } catch {}
  try { rmSync(RP_EXTRACT_DIR, { recursive: true }); } catch {}
  mkdirSync(BP_EXTRACT_DIR, { recursive: true });
  mkdirSync(RP_EXTRACT_DIR, { recursive: true });

  if (stableBehaviorPath && existsSync(stableBehaviorPath)) {
    execSync(`cp -r "${stableBehaviorPath}/." "${BP_EXTRACT_DIR}/"`, { encoding: "utf-8" });
    console.log(`[extract] Extracted BP to ${BP_EXTRACT_DIR}`);
  } else if (existsSync(join(tempExtract, "stable", "behavior"))) {
    const fallbackBehav = join(tempExtract, "stable", "behavior");
    execSync(`cp -r "${fallbackBehav}/." "${BP_EXTRACT_DIR}/"`, { encoding: "utf-8" });
    console.log(`[extract] Extracted BP (fallback) to ${BP_EXTRACT_DIR}`);
  }

  if (stableResourcePath && existsSync(stableResourcePath)) {
    execSync(`cp -r "${stableResourcePath}/." "${RP_EXTRACT_DIR}/"`, { encoding: "utf-8" });
    console.log(`[extract] Extracted RP to ${RP_EXTRACT_DIR}`);
  } else if (existsSync(join(tempExtract, "stable", "resource"))) {
    const fallbackResrc = join(tempExtract, "stable", "resource");
    execSync(`cp -r "${fallbackResrc}/." "${RP_EXTRACT_DIR}/"`, { encoding: "utf-8" });
    console.log(`[extract] Extracted RP (fallback) to ${RP_EXTRACT_DIR}`);
  }

  try { rmSync(tempExtract, { recursive: true }); } catch {}
  console.log("[extract] Extraction complete");

  // Verify
  if (existsSync(join(BP_EXTRACT_DIR, "loot_tables"))) {
    const ltFiles = readdirSync(join(BP_EXTRACT_DIR, "loot_tables"), { withFileTypes: true });
    console.log(`[extract] Verified: ${BP_EXTRACT_DIR}/loot_tables has ${ltFiles.length} entries`);
  }
}

export function findLootTablesPathFromExtracted(extractDir) {
  return join(extractDir, "loot_tables");
}
