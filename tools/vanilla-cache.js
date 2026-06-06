import { existsSync, mkdirSync, createWriteStream, createReadStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { spawn } from "child_process";

const __dirname = join(fileURLToPath(import.meta.url), "..");
const CACHE_DIR = join(__dirname, ".vanilla_cache");
const SAMPLES_ARCHIVE = join(CACHE_DIR, "bedrock-samples.tar.gz");
const SAMPLES_EXTRACTED = join(CACHE_DIR, "bedrock-samples");

const MOJANG_SAMPLES_URL = "https://api.github.com/repos/Mojang/bedrock-samples/tarball/main";

async function downloadTarball(url, outputPath) {
  console.log(`[vanilla-cache] Downloading Mojang bedrock-samples...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  
  mkdirSync(dirname(outputPath), { recursive: true });
  const fileStream = createWriteStream(outputPath);
  await pipeline(response.body, fileStream);
  const sizeMB = (require("fs").statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`[vanilla-cache] Saved to ${outputPath} (${sizeMB} MB)`);
}

async function extractTarball(archivePath, extractDir) {
  console.log(`[vanilla-cache] Extracting to ${extractDir}...`);
  mkdirSync(extractDir, { recursive: true });
  
  return new Promise((resolve, reject) => {
    const tar = spawn("tar", ["-xzf", archivePath, "-C", extractDir, "--strip-components=1"]);
    tar.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}`));
    });
    tar.on("error", reject);
  });
}

export async function ensureMojangSamples(forceDownload = false) {
  if (!existsSync(SAMPLES_EXTRACTED) || forceDownload) {
    if (!existsSync(SAMPLES_ARCHIVE) || forceDownload) {
      await downloadTarball(MOJANG_SAMPLES_URL, SAMPLES_ARCHIVE);
    }
    await extractTarball(SAMPLES_ARCHIVE, SAMPLES_EXTRACTED);
  }
  return SAMPLES_EXTRACTED;
}

export function getSamplesPath() {
  return SAMPLES_EXTRACTED;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("[vanilla-cache] Downloading/ extracting Mojang bedrock-samples...");
  ensureMojangSamples()
    .then((path) => {
      console.log(`[vanilla-cache] Ready at: ${path}`);
    })
    .catch(console.error);
}