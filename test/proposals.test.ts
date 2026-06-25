import { test } from "node:test";
import assert from "node:assert/strict";
import proposalsJson from "../src/data/proposals.json" with { type: "json" };
import { proposals, delegates } from "../src/index.js";
import type { Person, Proposal } from "../src/index.js";

const STAGES = new Set(["0", "1", "2", "2.7", "3", "4", "rejected", "withdrawn", "abandoned", "subsumed"]);
const SPECIFICATIONS = new Set(["ECMA-262", "ECMA-402", "ECMA-404"]);
const TERMINAL = new Set(["rejected", "withdrawn", "abandoned", "subsumed"]);

test("ids are unique and kebab-case", () => {
  // The Map is keyed by id, so a duplicate id would silently collapse two
  // entries — compare against the source array to catch that.
  assert.equal(proposals.size, (proposalsJson as unknown as Proposal[]).length, "duplicate proposal ids");
  for (const id of proposals.keys()) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `non-kebab id ${id}`);
});

test("every proposal has a valid stage, specification, string url, and non-empty name", () => {
  for (const p of proposals.values()) {
    assert.ok(STAGES.has(p.stage), `${p.id}: invalid stage ${p.stage}`);
    assert.ok(SPECIFICATIONS.has(p.specification), `${p.id}: invalid specification ${p.specification}`);
    assert.equal(typeof p.url, "string", `${p.id}: url is not a string`);
    assert.ok(p.name.length > 0, `${p.id}: empty name`);
  }
});

test("every delegate reference resolves to a known delegate", () => {
  const people = (p: Proposal): Person[] => [
    ...p.authors,
    ...p.champions,
    ...(p.stage27Reviewers ?? []),
  ];
  for (const p of proposals.values()) {
    for (const person of people(p)) {
      if (person.kind === "delegate") {
        assert.ok(delegates.has(person.abbreviation), `${p.id}: unknown delegate ${person.abbreviation}`);
      }
    }
  }
});

test("rationale is only on terminal proposals, non-empty, and free of status prefixes", () => {
  // A leading disposition word would duplicate the `stage` field (a word used
  // mid-sentence, e.g. "rejected for stage 1", is fine).
  const statusPrefix = /^(?:withdrawn|rejected|abandoned|inactive|postponed|obsoleted)(?:\s*[:;]|\.?\s*$)/i;
  for (const p of proposals.values()) {
    if (p.rationale === undefined) continue;
    assert.ok(TERMINAL.has(p.stage), `${p.id}: non-terminal proposal has a rationale`);
    assert.ok(p.rationale.length > 0, `${p.id}: empty rationale`);
    assert.doesNotMatch(p.rationale, statusPrefix, `${p.id}: rationale retains a status prefix`);
  }
});

test("presentation dates are valid YYYY-MM(-DD) calendar dates", () => {
  // Month must be 01–12 and day (when present) 01–31 — not merely two digits.
  const validDate = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;
  for (const p of proposals.values()) {
    for (const presentation of p.presentations) {
      assert.match(presentation.date, validDate, `${p.id}: invalid date ${presentation.date}`);
    }
  }
});

test("lookups resolve proposals by id", () => {
  assert.equal(proposals.get("temporal")?.name, "Temporal");
  assert.equal(proposals.get("nonexistent-proposal"), undefined);
  const intl = [...proposals.values()].filter((p) => p.specification === "ECMA-402");
  assert.ok(intl.length > 0);
  assert.ok(intl.every((p) => p.specification === "ECMA-402"));
});
