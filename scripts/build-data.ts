/**
 * Emit minified copies of the canonical datasets into `dist/data/`.
 *
 * The repository keeps `src/data/*.json` pretty-printed for hand-maintenance;
 * the published package ships only `dist/`, so this step writes the compact
 * JSON that the compiled loaders import at runtime. Runs after `tsc`.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR, ROOT } from "./lib/paths.js";

const outDir = path.join(ROOT, "dist", "data");
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const file of readdirSync(DATA_DIR)) {
  if (!file.endsWith(".json")) continue;
  const value = JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8"));
  writeFileSync(path.join(outDir, file), JSON.stringify(value));
  count++;
}

console.log(`Minified ${count} data file(s) → dist/data/`);
