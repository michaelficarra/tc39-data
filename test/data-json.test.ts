import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { findDuplicateJsonKeys } from "../src/validate-json.js";

// The canonical, hand-maintained data files. JSON.parse would silently drop a
// duplicate key (keeping the last), so this guard scans the raw source instead.
const DATA_DIR = new URL("../src/data/", import.meta.url);

test("no data file has duplicate JSON keys", () => {
  const files = readdirSync(DATA_DIR).filter((name) => name.endsWith(".json"));
  // Guard against the glob silently matching nothing (e.g. a moved directory).
  assert.ok(files.length > 0, "expected at least one data file to validate");
  for (const file of files) {
    const text = readFileSync(new URL(file, DATA_DIR), "utf8");
    assert.deepEqual(findDuplicateJsonKeys(text), [], `${file} has duplicate JSON key(s)`);
  }
});

test("findDuplicateJsonKeys flags a repeated key in an object", () => {
  assert.deepEqual(findDuplicateJsonKeys('{"MF":{"name":"A"},"MF":{"name":"B"}}'), ["MF"]);
});

test("findDuplicateJsonKeys does not flag keys repeated across sibling objects", () => {
  // `id`/`name` recur once per element — that is not a duplicate within any one object.
  assert.deepEqual(findDuplicateJsonKeys('[{"id":"a","name":"x"},{"id":"b","name":"y"}]'), []);
});

test("findDuplicateJsonKeys flags a duplicate nested inside one object", () => {
  assert.deepEqual(findDuplicateJsonKeys('{"AA":{"name":"x","name":"y"}}'), ["name"]);
});

test("findDuplicateJsonKeys is not confused by structural characters inside string values", () => {
  // The first value is the string `}{:"` — its braces, colon and escaped quote must not
  // be read as structure, so the repeated `a` key is still the only duplicate found.
  assert.deepEqual(findDuplicateJsonKeys('{"a":"}{:\\"","a":1}'), ["a"]);
});

test("findDuplicateJsonKeys compares keys by their decoded value", () => {
  // `"a"` decodes to `"a"`, so these two keys collide just as JSON.parse would merge them.
  assert.deepEqual(findDuplicateJsonKeys('{"a":1,"\\u0061":2}'), ["a"]);
});
