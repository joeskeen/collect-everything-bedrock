import { argv, parallel, series, task, tscTask } from "just-scripts";
import {
  BundleTaskParameters,
  CopyTaskParameters,
  bundleTask,
  cleanTask,
  cleanCollateralTask,
  copyTask,
  coreLint,
  mcaddonTask,
  ZipTaskParameters,
  STANDARD_CLEAN_PATHS,
  DEFAULT_CLEAN_DIRECTORIES,
  watchTask,
  updateWorldTask,
} from "@minecraft/core-build-tasks";
import path from "path";
import fs from "fs";
import { name as projectName, version as projectVersion, productName as displayName } from "./package.json";
import semver from "semver";
import "varlock/auto-load";

process.env.PROJECT_NAME = projectName;
const version = semver.parse(projectVersion);
if (!version) {
  throw new Error("invalid package version");
}
const versionArray = [version.major, version.minor, version.patch];

const bundleTaskOptions: BundleTaskParameters = {
  entryPoint: path.join(__dirname, "./scripts/main.ts"),
  external: ["@minecraft/math", "@minecraft/server", "@minecraft/server-ui", "@minecraft/vanilla-data"],
  outfile: path.resolve(__dirname, "./dist/scripts/main.js"),
  minifyWhitespace: true,
  sourcemap: false,
  outputSourcemapPath: path.resolve(__dirname, "./dist/debug"),
};
const copyTaskOptions: CopyTaskParameters = {
  copyToBehaviorPacks: [`./behavior_packs/${projectName}`],
  copyToScripts: ["./dist/scripts"],
  copyToResourcePacks: [`./resource_packs/${projectName}`],
};
const mcaddonTaskOptions: ZipTaskParameters = {
  ...copyTaskOptions,
  outputFile: `./dist/packages/${projectName}-v${projectVersion}.mcaddon`,
};
task("lint", coreLint(["scripts/**/*.ts"], argv().fix));
task("typescript", tscTask());
task("bundle", bundleTask(bundleTaskOptions));
task("stamp", () => {
  (() => {
    const rpManifestPath = path.resolve(__dirname, "resource_packs", projectName, "manifest.json");
    const rpManifest = JSON.parse(fs.readFileSync(rpManifestPath).toString());
    rpManifest.header.name = `${displayName} v${projectVersion} Resource Pack`;
    rpManifest.header.version = versionArray;
    // currently all modules and dependencies for the resource pack are internal, so we stamp all
    rpManifest.modules.forEach((m: any) => (m.version = versionArray));
    rpManifest.dependencies.forEach((m: any) => (m.version = versionArray));
    console.log("stamped resource pack manifest", JSON.stringify(rpManifest));
    fs.writeFileSync(rpManifestPath, JSON.stringify(rpManifest, null, 2));
  })();

  (() => {
    const bpManifestPath = path.resolve(__dirname, "behavior_packs", projectName, "manifest.json");
    const bpManifest = JSON.parse(fs.readFileSync(bpManifestPath).toString());
    bpManifest.header.name = `${displayName} v${projectVersion}`;
    bpManifest.header.version = versionArray;
    // currently all modules for the behavior pack are internal, so we stamp all
    // but we DON'T stamp dependencies since they are external
    bpManifest.modules.forEach((m: any) => (m.version = versionArray));
    console.log("stamped behavior pack manifest", JSON.stringify(bpManifest));
    fs.writeFileSync(bpManifestPath, JSON.stringify(bpManifest, null, 2));
  })();
});
task("build", series("stamp", "typescript", "bundle"));
task("clean-local", cleanTask(DEFAULT_CLEAN_DIRECTORIES));
task("clean-collateral", cleanCollateralTask(STANDARD_CLEAN_PATHS));
task("clean", parallel("clean-local", "clean-collateral"));
task("generateWorldPackManifests", () => {
  const outputDir = path.resolve(__dirname, "dist/packages");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const bpManifestPath = path.resolve(__dirname, "behavior_packs", projectName, "manifest.json");
  const rpManifestPath = path.resolve(__dirname, "resource_packs", projectName, "manifest.json");
  const bpManifest = JSON.parse(fs.readFileSync(bpManifestPath).toString());
  const rpManifest = JSON.parse(fs.readFileSync(rpManifestPath).toString());

  const worldBehaviorPacks = [{ pack_id: bpManifest.header.uuid, version: bpManifest.header.version }];
  const worldResourcePacks = [{ pack_id: rpManifest.header.uuid, version: rpManifest.header.version }];

  fs.writeFileSync(path.join(outputDir, "world_behavior_packs.json"), JSON.stringify(worldBehaviorPacks, null, 2));
  fs.writeFileSync(path.join(outputDir, "world_resource_packs.json"), JSON.stringify(worldResourcePacks, null, 2));
  console.log("Generated world_behavior_packs.json and world_resource_packs.json");
});
task("copyArtifacts", copyTask(copyTaskOptions));
task("package", series("clean-collateral", "copyArtifacts", "generateWorldPackManifests"));
task(
  "local-deploy",
  watchTask(
    [
      "scripts/**/*.ts",
      "behavior_packs/**/*.{json,lang,tga,ogg,png}",
      "resource_packs/**/*.{json,lang,tga,ogg,png}",
      "!**/manifest.json",
    ],
    series("clean-local", "build", "package")
  )
);
task("createMcaddonFile", mcaddonTask(mcaddonTaskOptions));
task("mcaddon", series("clean-local", "build", "generateWorldPackManifests", "createMcaddonFile"));
