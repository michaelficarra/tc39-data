/**
 * Auto-format the canonical JSON datasets in src/data/.
 *
 *  - default:  rewrite any out-of-format file in place.
 *  - --check:  report out-of-format files and exit non-zero without writing
 *              (used as a CI gate).
 *
 * The canonical form is whatever `formatJson` produces (2-space indent, trailing
 * newline). Object key order is preserved as authored — a JSON parse→stringify
 * round-trip keeps it — so this only normalises whitespace, never reorders data.
 */

import { readdirSync } from "node:fs";
import { DATA_DIR, formatJson, readData, writeData } from "./lib/paths.js";

const check = process.argv.includes("--check");

// Discover data files dynamically so new ones are covered without edits here.
const files = readdirSync(DATA_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort();

const misformatted: string[] = [];
for (const name of files) {
  const current = readData(name);
  const formatted = formatJson(JSON.parse(current));
  if (current === formatted) continue;

  if (check) {
    misformatted.push(name);
  } else {
    writeData(name, JSON.parse(current));
    console.log(`✓ formatted src/data/${name}`);
  }
}

if (check && misformatted.length > 0) {
  console.error("✗ The following data files are not correctly formatted:");
  for (const name of misformatted) console.error(`    src/data/${name}`);
  console.error("\nRun `npm run format` to fix.");
  process.exit(1);
}

console.log(check ? "✓ All data files are correctly formatted." : "Done.");
