/** Shared filesystem locations and small JSON helpers for the build scripts. */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path to the repository root. */
export const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");

/** Canonical (pretty-printed) data directory. */
export const DATA_DIR = path.join(ROOT, "src", "data");

/** Local cache of cloned/fetched upstream sources (gitignored). */
export const UPSTREAM_DIR = path.join(ROOT, ".upstream");

/** Write a value as pretty-printed JSON (2-space indent, trailing newline). */
export function writeData(name: string, value: unknown): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(path.join(DATA_DIR, name), JSON.stringify(value, null, 2) + "\n");
}

/** Read a raw data file from the canonical data directory. */
export function readData(name: string): string {
  return readFileSync(path.join(DATA_DIR, name), "utf8");
}
