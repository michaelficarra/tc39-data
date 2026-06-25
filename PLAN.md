# Plan: `tc39-data` — a single-source-of-truth npm module for TC39 data

## Context

TC39's important information is currently scattered across repositories in semi-/unstructured
documents: proposals as markdown tables in [tc39/proposals], the delegate list in
[tc39/notes/delegates.txt], and the working process as an HTML document in
[tc39/process-document]. This makes the data hard to consume programmatically and easy to let
drift. We are bootstrapping a brand-new (currently empty) git repository into an **ESM npm
package** that aggregates this information into a **structured, typed representation** that
becomes the single source of truth. After initial generation the data will be **maintained by
hand**, so the importers below are one-time bootstrap tools, not a permanent pipeline.

The package will export the aggregated datasets plus TypeScript schema types. As proof that the
migration is faithful and complete, we provide reconstructors that rebuild the original source
files from the structured data — run **once** during generation (no ongoing CI diff gate). A
second phase adds a GitHub Action that builds a browsable/filterable static site and deploys it
to GitHub Pages. Finally we document everything in `README.md`.

[tc39/proposals]: https://github.com/tc39/proposals
[tc39/notes/delegates.txt]: https://github.com/tc39/notes/blob/main/delegates.txt
[tc39/process-document]: https://github.com/tc39/process-document/blob/gh-pages/index.html
[tc39/proposals#605]: https://github.com/tc39/proposals/pull/605

## Source-format findings (from exploration)

- **delegates.txt** — one entry per line, `Full Name (ABBR)`, sorted alphabetically by full name;
  ~1000 entries; no headers/blank lines/sections. Edge cases: non-ASCII names (e.g. `André
  Bargull`), and abbreviations that vary in length (2–3 letters). The upstream line regex treats
  the name as everything before ` (`, so names themselves are otherwise unconstrained. Cleanly and
  byte-exactly reversible from a `{ ABBR: name }` map plus a locale-aware line sort.
- **tc39/proposals** — five top-level markdown files plus a parallel `ecma402/` set:
  - `README.md` → active **Stage 3 / 2.7 / 2** tables (slightly different columns each).
  - `finished-proposals.md` → **Stage 4** (`Proposal | Author | Champion(s) | Meeting Notes | Expected Publication Year`).
  - `stage-1-proposals.md`, `stage-0-proposals.md` → (`Proposal | Author | Champion | Meeting Notes`).
  - `inactive-proposals.md` → (`Proposal | Champion | Rationale | Meeting Notes`); the **Rationale**
    cell encodes status (`Withdrawn:`/`Rejected:`/`Postponed`/`Obsoleted`/…). We split this into
    three terminal stages — **rejected / withdrawn / abandoned** — and **omit** never-presented
    rows (the 4 entries removed by [tc39/proposals#605]), which the upstream definition agrees
    should never have been listed.
  - `ecma402/` → `README.md`, `finished-proposals.md`, `stage-0-proposals.md`, `inactive-proposals.md` (no stage-1 file).
  - Encoding: proposal names are reference-style links `[Display][anchor]` with a definition block
    at file bottom; authors/champions are **full names** `<br />`-separated; meeting notes are
    `<sub>…&nbsp;-[YYYY&#8209;MM][anchor]<br />…</sub>` (non-breaking-hyphen entity), with some
    dates unlinked and some `Never presented`; Stage 3/2.7 have a **Test262 Feature Flag** cell
    (`[label][anchor]` / `No test262 tests` / `:question:`); Stage 2 has a **Stage 2.7 reviewers**
    cell. No existing generator/linter/workflow — tables are hand-maintained.
- **process-document/index.html** — mostly prose (~4k words, 16 sections) with one structured
  table, *ECMAScript Proposal Stages* (`Stage | Status | Entrance Criteria | Purpose`). Only this
  stages table is modelled; the surrounding prose is out of scope.

## Decisions (confirmed with user)

| Area | Decision |
|---|---|
| Reconstruction fidelity | Pragmatic: byte-exact for `delegates.txt`; round-trip (parse∘generate) equivalence + normalised diff for proposals markdown. **Validation is one-time**, not a CI gate. |
| Datasets in v1 | ECMA-262 proposals + delegates (core) **plus** ECMA-402 proposals **and** process stage definitions. |
| Packaging | Author in TypeScript; `tsc` builds `src/` → `dist/` (ESM `.js` + `.d.ts`). Canonical data as JSON. |
| Static site | Lightweight SSG — **Astro** (static HTML, tiny client filter script, GitHub Pages deploy). |
| Tooling | npm (Volta-pinned Node, target 22 / engines `>=20.10`); tests via Node's built-in runner with the `tsx` loader. |

Small open items (non-blocking, will default unless told otherwise): package name `@tc39/data`;
licence MIT.

## Repository layout

```
tc39-data/
├── package.json              # ESM ("type":"module"), exports map, scripts, engines, volta pin
├── tsconfig.json             # module: NodeNext, resolveJsonModule, declaration, outDir dist
├── .gitignore                # dist/, node_modules/, site build output
├── PLAN.md                    # this plan, committed first as a historical record
├── README.md                 # phase 3
├── src/
│   ├── index.ts              # re-exports types + datasets + helper accessors
│   ├── types.ts              # the TypeScript schema (see below)
│   ├── validate-delegates.ts # shared, ported delegate validator
│   ├── proposals.ts          # imports ./data/proposals.json, exports typed `proposals`
│   ├── delegates.ts          # imports ./data/delegates.json, exports typed `delegates`
│   ├── process-stages.ts     # imports ./data/process-stages.json, exports `processStages`
│   └── data/                 # ← canonical structured data, PRETTY-printed (hand-maintained)
│       ├── proposals.json    #     Proposal[] (ECMA-262 + ECMA-402)
│       ├── delegates.json    #     { "ABBR": "Full Name", ... }
│       └── process-stages.json  #  ProcessStage[]
│   # build emits dist/ = compiled .js + .d.ts + MINIFIED dist/data/*.json (published)
├── scripts/
│   ├── import/               # one-time bootstrap importers (upstream → src/data/*.json)
│   │   ├── delegates.ts
│   │   ├── proposals.ts
│   │   └── process-stages.ts
│   ├── reconstruct/          # src/data/*.json → original source text
│   │   ├── delegates.ts
│   │   └── proposals.ts
│   └── validate.ts           # clone upstream into tmp, reconstruct, diff/round-trip, report
├── test/                     # node:test via tsx — invariant checks
│   └── *.test.ts
├── site/                     # Astro project (phase 2)
│   ├── astro.config.mjs      # base = '/<repo>' for Pages
│   └── src/pages/…           # index, proposals (filterable), delegates, stages
└── .github/workflows/
    ├── ci.yml                # install → typecheck → build → test
    └── deploy-site.yml       # build pkg → build Astro → deploy to Pages
```

Canonical, **pretty-printed** JSON lives in `src/data/` (hand-maintained, human-diffable; consumed
by the importers, reconstructors, tests and the site). Loaders import it relative to themselves:
`import x from "./data/x.json" with { type: "json" }` (import attributes, enabled by
`resolveJsonModule` + `module: NodeNext`, `engines.node >=20.10`). The `build` step runs `tsc`
(compiling `src/` → `dist/`; tsc does **not** copy `.json`) followed by a small `build:data` script
that writes **minified** JSON to `dist/data/*.json`. Thus `./data/x.json` resolves to the pretty
`src/data/x.json` in dev (tsx) and to the minified `dist/data/x.json` at runtime in the built
package. Only `dist/` is published (`"files": ["dist"]`), so **the npm package ships minified JSON**
while the repo keeps the readable source. (Fallback if import attributes prove troublesome for
consumers: generate typed `src/generated/*.ts` from the JSON at build time.)

## Schema (`src/types.ts`)

```ts
export type Specification = "ECMA-262" | "ECMA-402" | "ECMA-404"; // ECMA-404 (JSON): no current proposals
export type ProposalStage =
  | "0" | "1" | "2" | "2.7" | "3" | "4"        // active maturity stages
  | "rejected" | "withdrawn" | "abandoned";    // terminal statuses (the former "inactive" list)

/** A single committee presentation of a proposal. */
export interface Presentation {
  date: string;            // "YYYY-MM"
  notesUrl?: string;       // meeting-notes link, when the source links it
}

/** Test262 coverage as shown in the Stage 3/2.7 tables. */
export interface Test262Coverage {
  hasTests: boolean;
  url?: string;            // code-search / tests link
  featureFlag?: string;    // the test262 feature-flag name shown in the cell
}

/** A TC39 delegate, referenced by their official abbreviation (a key in DelegateMap). */
export interface DelegateRef {
  kind: "delegate";
  abbreviation: string;
}

/** A non-delegate community contributor. */
export interface CommunityMember {
  kind: "community";
  name: string;            // full name
  github?: string;         // GitHub username, when known
}

/** An author / champion / reviewer: a delegate (by abbreviation) or a community member (by name). */
export type Person = DelegateRef | CommunityMember;

export interface Proposal {
  id: string;              // immutable kebab-case identifier, frozen once assigned
  name: string;            // display name (may contain code formatting upstream)
  url: string;             // canonical proposal URL (GitHub repo / spec)
  specification: Specification;
  stage: ProposalStage;
  authors: Person[];
  champions: Person[];
  presentations: Presentation[];   // empty ⇒ "Never presented"
  test262?: Test262Coverage;        // Stage 3 / 2.7
  stage27Reviewers?: Person[];      // Stage 2 table only
  expectedPublicationYear?: number; // Stage 4 only
  rationale?: string;               // rejected/withdrawn/abandoned: the inactivity rationale text
}

/** Maps an official delegate abbreviation to the delegate's full name. */
export type DelegateMap = Record<string, string>;  // { "AVP": "Aakash Patel", ... }

/** One maturity stage from the process document. */
export interface ProcessStage {
  stage: string;           // "0"–"4"
  status: string;
  entranceCriteria: string;
  purpose: string;
  acceptanceSignifies?: string;
}
```

`src/index.ts` re-exports the types, the three datasets (`proposals: Proposal[]`,
`delegates: DelegateMap`, `processStages: ProcessStage[]`), and a few thin helpers
(`getProposalById`, `proposalsByStage`, `proposalsBySpecification`). Subpath exports
(`@tc39/data/proposals`, `/delegates`, `/process-stages`) allow narrow imports.

### Immutable `id` derivation

Assigned once by the importer, then **frozen in JSON** (never recomputed, so renames don't break
it): prefer the GitHub repo slug from `url` (`…/tc39/proposal-foo-bar` → `foo-bar`), else
kebab-case of `name`. Disambiguate ECMA-402 collisions with an `intl-` prefix where needed.

## Ported `delegates.txt` validations (`src/validate-delegates.ts`)

tc39/notes already validates `delegates.txt` via `scripts/check-delegates.mjs` (run in its `test`
script). We port those rules into a shared validator that runs over the structured
`DelegateMap` — used **both** by the importer and as **permanent** invariant tests (these are
cheap data-only checks and stay in CI, distinct from the one-time reconstruction validation):

1. **Abbreviation format** — every key matches `^[A-Z]+$` (uppercase Latin letters only).
2. **Abbreviation length** — exactly **2 or 3** characters.
3. **Two-letter allowlist** — any 2-letter abbreviation must be in the fixed legacy set ported
   verbatim from upstream (`TWO_LETTER_ABBRS`: `AC AH AK AR AS BB … ZB`, 84 entries); new
   abbreviations must be 3 letters.
4. **Uniqueness** — abbreviations are unique. Map keys guarantee this structurally, so the importer
   additionally asserts the entry count equals the number of source lines (no silent key collapse),
   and the validator rejects duplicate **names** as well.
5. **Lexicographic ordering** — the reconstructed lines must be in `localeCompare(a, b, 'en')`
   order (the same English-locale comparison upstream enforces); the validator/test asserts the
   sorted reconstruction is stable.

The exact upstream regex (`^(?<name>[^(]+)(?: \((?<abbr>[^)]*)\))?$`) and the allowlist are
reproduced in the importer so parsing and validation match upstream behaviour exactly.

## One-time importers (`scripts/import/*`)

Clone the upstream repos into a temp dir, parse, and write pretty-printed `src/data/*.json`:

- **delegates** — match trailing `\(([^)]+)\)$` per line → `{ ABBR: name }`; assert entry count.
- **proposals** — for each markdown file (and its `ecma402/` sibling): resolve the bottom
  reference-link definitions to URLs, parse each table row into a `Proposal` (mapping file→stage,
  splitting `<br />` lists, parsing `<sub>…[YYYY‑MM][anchor]…</sub>` into `presentations`, decoding
  the Test262 / reviewers / rationale / publication-year cells), tag `specification`, assign `id`.
  Resolve each author/champion/reviewer full name against the delegates dataset (exact match →
  `{ kind: "delegate", abbreviation }`, else `{ kind: "community", name }`); unmatched names are
  logged for manual review. Requires the delegates import to run first (so the name→abbr index
  exists). For `inactive-proposals.md` (and its ecma402 sibling), classify each remaining row by
  its Rationale text into stage `rejected` (starts "Rejected…"), `withdrawn` (starts "Withdrawn…"),
  or `abandoned` (presented then dropped — Postponed/Inactive/Obsoleted/Superseded/…); store the
  full Rationale in `rationale`; **omit** the 4 never-presented rows corrected by
  [tc39/proposals#605], and log any row whose status is ambiguous.
- **process-stages** — parse the *ECMAScript Proposal Stages* `<table>` from `index.html`
  (dev-dependency `node-html-parser`) into `ProcessStage[]`.

## Reconstruction & validation (`scripts/reconstruct/*`, `scripts/validate.ts`)

Run **once** during generation (`npm run validate`); not wired into CI.

- **delegates** — reconstruct each entry as the line `Name (ABBR)`, sort the lines with
  `localeCompare(a, b, 'en')` (matching upstream's ordering check exactly), join with `\n`; assert
  **byte-identical** to upstream `delegates.txt`. The shared delegate validator above must also pass.
- **proposals** — regenerate each markdown file from the data (rendering each `Person` back to a
  full name — delegate abbreviations resolved via `DelegateMap`), then re-parse the regenerated
  text with the importer's parser and assert it **deep-equals** the original parsed data (round-trip
  stability); additionally emit a normalised diff against upstream for human review. Byte-identity
  is not required.
- `validate.ts` clones upstream into `/tmp`, runs both, and prints a pass/fail report. Its result
  is recorded in the commit message / PR description rather than enforced on every push.

## Package config highlights (`package.json`, `tsconfig.json`)

- `"type": "module"`, `"exports"` with `types`+`import` conditions for `.` and the three subpaths
  (plus `"./data/*.json"` → the minified `dist/data/*.json` for consumers wanting raw JSON),
  `"files": ["dist"]` (publishes minified JSON only), `"engines": { "node": ">=20.10" }`, Volta pin.
- Scripts: `build` (`tsc` then `build:data`), `build:data` (minify `src/data/*.json` →
  `dist/data/*.json`), `typecheck` (`tsc --noEmit`), `test` (`node --import tsx --test
  test/*.test.ts`), `import:delegates|proposals|stages`, `validate`, and `site:dev` / `site:build`.
- `tsconfig.json`: `module`/`moduleResolution` `NodeNext`, `resolveJsonModule`, `declaration`,
  `strict`, `rootDir: src`, `outDir: dist`.
- Tests assert invariants (ids unique + kebab-case, stages within the union, every proposal has a
  URL, every `DelegateRef.abbreviation` resolves to a known delegate, every
  rejected/withdrawn/abandoned proposal carries a `rationale`) **and the full ported
  `delegates.txt` rules** (abbreviation format/length, two-letter
  allowlist, uniqueness, lexicographic order — via the shared `src/validate-delegates.ts`) — these
  are the durable, data-only guarantees that stay in CI, distinct from the one-time reconstruction
  checks.

## Phase 2 — static site (`site/`, Astro)

Astro project consuming the pretty JSON in `src/data/` (imported at build time). Pages: an overview index; a
**proposals** page rendering a table with a small client-side filter/search island (by
specification, stage, champion, free text); a **delegates** page (searchable abbr↔name list); a
**stages** page from `processStages`. Each table also supports **sorting by every field where it
makes sense** (click-to-sort column headers, ascending/descending): proposals by name, id, stage,
specification, expected publication year, number of presentations, and most-recent presentation
date; delegates by abbreviation and by name; stages by stage number. Sorting is handled in the
same small client island as the filtering (text/number/date comparators as appropriate, with the
delegate/name ordering using locale-aware comparison). `astro.config.mjs` sets `base` to the repo
name for Pages.
`.github/workflows/deploy-site.yml` builds the package then the site and deploys via
`actions/configure-pages` + `upload-pages-artifact` + `deploy-pages` (on push to `main` +
`workflow_dispatch`). `ci.yml` runs typecheck/build/test on push & PR.

## Phase 3 — `README.md`

Document purpose (single source of truth), repository layout, and the exported API with usage
examples. For the schema, **link to `src/types.ts`** as the canonical definition rather than
duplicating the type listing in prose (so it can't drift). Also cover the data-maintenance workflow
(edit `src/data/*.json` by hand; importers are bootstrap-only), the one-time validation story, the
site, and the technologies in use (TypeScript, ESM, `tsc`, Node test runner + `tsx`, Astro, GitHub
Pages/Actions, Volta).

## Execution order

1. Write `PLAN.md` (this plan) at the repo root, for historical record.
2. Scaffold package: `package.json`, `tsconfig.json`, `.gitignore`, `src/types.ts`, empty `src/data/`.
3. Write importers; run against freshly-cloned upstream to generate `src/data/*.json` — delegates
   first, then proposals (so author/champion names resolve to delegate abbreviations), then stages.
4. Write loaders (`src/*.ts`) + `index.ts`; `npm run build` + `typecheck`.
5. Write reconstructors + `validate.ts`; run `npm run validate`; record the fidelity result.
6. Write invariant tests; `npm test`.
7. Phase 2: Astro `site/` + the two workflows.
8. Phase 3: `README.md`.

## Verification

- `npm run build` and `npm run typecheck` succeed; `dist/` contains `.js` + `.d.ts` plus
  **minified** `dist/data/*.json` (single line, no indentation), while `src/data/*.json` stay pretty.
- `npm test` passes (schema invariants).
- `npm run validate` reports `delegates.txt` byte-exact and proposals round-trip-stable (one-time).
- `node -e "import('./dist/index.js').then(m => console.log(m.proposals.length, Object.keys(m.delegates).length, m.processStages.length))"` prints sensible counts.
- `npm run site:build` produces a static site; the deploy workflow publishes it to Pages and the
  proposals filter and column sorting work in the browser.
