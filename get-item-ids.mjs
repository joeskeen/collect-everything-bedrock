import { load } from "cheerio";
import { writeFileSync } from "fs";
import { join } from "path";

const __dirname = import.meta.dirname;
const outputPath = join(__dirname, "./scripts/data/internalIds.json");

const url =
  "https://learn.microsoft.com/en-us/minecraft/creator/reference/content/vanillalistingsreference/items?view=minecraft-bedrock-stable";
const response = await fetch(url);
const html = await response.text();
const $ = load(html);
const entries = $("tr")
  .has("td")
  .map((_, tr) => {
    const cells = $(tr).children();
    return [[`minecraft:${cells.eq(0).text().trim()}`, Number(cells.eq(1).text().trim())]];
  })
  .get()
  .reduce((prev, curr) => {
    prev[curr[0]] = curr[1];
    return prev;
  }, {});
writeFileSync(outputPath, JSON.stringify(entries, null, 2));
console.log(`Done. ${Object.keys(entries).length} IDs mapped.`);
