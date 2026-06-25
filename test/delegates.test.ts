import { test } from "node:test";
import assert from "node:assert/strict";
import { delegates } from "../src/index.js";
import { validateDelegates, TWO_LETTER_ABBRS } from "../src/validate-delegates.js";

test("delegates satisfy the ported delegates.txt validation rules", () => {
  // The validator runs over the record/JSON shape; convert the Map back for it.
  assert.deepEqual(validateDelegates(Object.fromEntries(delegates)), []);
});

test("every abbreviation is 2–3 uppercase letters; 2-letter codes are allowlisted", () => {
  for (const abbr of delegates.keys()) {
    assert.match(abbr, /^[A-Z]{2,3}$/, `bad abbreviation ${abbr}`);
    if (abbr.length === 2) {
      assert.ok(TWO_LETTER_ABBRS.has(abbr), `2-letter abbreviation ${abbr} is not allowlisted`);
    }
  }
});

test("delegate names are unique and non-empty", () => {
  const names = [...delegates.values()].map((d) => d.name);
  for (const name of names) assert.ok(name.length > 0);
  assert.equal(new Set(names).size, names.length, "duplicate delegate names");
});

test("affiliations, when present, are non-empty strings", () => {
  for (const [abbr, { affiliation }] of delegates) {
    if (affiliation !== undefined) {
      assert.equal(typeof affiliation, "string", `affiliation for ${abbr} must be a string`);
      assert.ok(affiliation.length > 0, `affiliation for ${abbr} must be non-empty`);
    }
  }
});

test("GitHub usernames, when present, are well-formed and unique", () => {
  const seen = new Map<string, string>();
  for (const [abbr, { github }] of delegates) {
    if (github === undefined) continue;
    assert.match(github, /^[a-zA-Z\d][a-zA-Z\d-]{0,38}$/, `bad GitHub username for ${abbr}: ${github}`);
    assert.ok(!seen.has(github), `duplicate GitHub username ${github} for ${seen.get(github)} and ${abbr}`);
    seen.set(github, abbr);
  }
});
