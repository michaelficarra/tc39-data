> [!IMPORTANT]
> This is an experiment. It is not yet endorsed by TC39 and is not actually published to npm.

# @tc39/data

Structured, typed datasets for TC39. A single source of truth for proposals, delegates,
the TC39 process, etc.

Today this information is spread across semi-structured documents in several repositories:
proposals as Markdown tables in [tc39/proposals], the delegate list in
[tc39/notes/delegates.txt], and the working process as an HTML document in
[tc39/process-document]. This package aggregates that information into a single, machine-readable,
typed representation, published to npm and browsable as a static website.

[tc39/proposals]: https://github.com/tc39/proposals
[tc39/notes/delegates.txt]: https://github.com/tc39/notes/blob/main/delegates.txt
[tc39/process-document]: https://github.com/tc39/process-document/blob/gh-pages/index.html

## Installation

```sh
npm install @tc39/data
```

Requires Node.js ≥ 20.10 (for JSON import attributes). The package is ESM-only.

## Usage

Each dataset is a `Map` keyed by its natural identifier — proposals by `id`,
delegates by abbreviation, stages by stage number.

```js
import { proposals, delegates, processStages } from "@tc39/data";

proposals.size;                       // → count of every ECMA-262 and ECMA-402 proposal
proposals.get("temporal");            // → { id: "temporal", name: "Temporal", stage: "4", … }
delegates.get(abbreviation);          // → { name, github?, affiliation? }, e.g. delegates.get("…")
processStages.get("3");               // → { stage: "3", status, entranceCriteria, purpose }

// Filter by iterating the values:
[...proposals.values()].filter((p) => p.stage === "3");          // Stage 3 proposals
[...proposals.values()].filter((p) => p.specification === "ECMA-402"); // the Intl proposals
```

Each dataset is also available as a sub-path import (`@tc39/data/proposals`,
`@tc39/data/delegates`, `@tc39/data/process-stages`) and as raw JSON
(`@tc39/data/data/proposals.json`).

### Schema

The full schema is the canonical TypeScript definition in [`src/types.ts`](src/types.ts) — see it
for the exact shapes of `Proposal`, `Person` (a `DelegateRef` or a `CommunityMember`),
`Presentation`, `Test262Coverage`, `DelegateMap`, and `ProcessStage`. A few highlights:

- A **proposal** has an immutable kebab-case `id`, a `name`, `url`, `specification`
  (`ECMA-262` / `ECMA-402` / `ECMA-404`), a `stage`, `authors`/`champions`, and `presentations`.
- A proposal's **stage** is one of `0`, `1`, `2`, `2.7`, `3`, `4`, or one of the terminal statuses
  `rejected` / `withdrawn` / `abandoned` / `subsumed` (the former single "inactive" bucket,
  classified from the upstream rationale; `subsumed` is for proposals merged into or subsumed by
  another. Proposals that were never actually presented are omitted).
- **Authors, champions, and reviewers** are each either a delegate (referenced by abbreviation,
  which keys into `delegates`) or a community member (a full name and optional GitHub username).
- The **delegates** dataset maps each abbreviation to a `{ name, github?, affiliation? }` record.
  Both `github` (the delegate's GitHub username) and `affiliation` (the TC39 member organisation
  they represent) are sourced from the [tc39 GitHub org's teams](https://github.com/orgs/tc39/teams).
  `affiliation` is absent for delegates not on a member-organisation team; `github` is absent for
  those who could not be matched to any team member.

## Repository layout

```
src/
  types.ts              The schema (canonical TypeScript definitions)
  index.ts              Public entry point: the three datasets and the schema types
  proposals.ts          Loads & exports the typed `proposals` dataset
  delegates.ts          Loads & exports the typed `delegates` map
  process-stages.ts     Loads & exports the typed `processStages`
  validate-delegates.ts Delegate validation rules, ported from tc39/notes
  data/                 Canonical datasets, pretty-printed (hand-maintained)
    proposals.json  delegates.json  process-stages.json
scripts/
  lib/                  Shared parsing/rendering: delegates, proposals, markdown
  import/               One-time bootstrap importers (upstream → src/data)
  reconstruct/          Reconstruct original sources from the data
  build-data.ts         Minify src/data → dist/data for publishing
  validate.ts           One-time fidelity check (see below)
test/                   Invariant tests (node:test)
site/                   Astro static site (browse / filter / sort)
.github/workflows/      ci.yml (build & test) and deploy-site.yml (Pages)
PLAN.md                 The original generation plan, kept for the record
```

The published package contains only `dist/` — compiled ESM (`.js`), type declarations (`.d.ts`),
and **minified** copies of the datasets. The pretty-printed `src/data/*.json` are the
human-maintained source.

## Maintaining the data

After the initial import the datasets are **maintained by hand**: edit the pretty-printed JSON in
`src/data/` directly. The importers in `scripts/import/` are one-time bootstrap tools that seeded
the data from the upstream repositories; they are kept for reference, not run on every change.

```sh
npm run build       # tsc → dist, then minify datasets into dist/data
npm run typecheck   # type-check src, scripts, and tests
npm test            # invariant tests, including the ported delegate rules
```

The delegate rules ported from tc39/notes' `check-delegates.mjs` (abbreviation format and length,
the legacy two-letter allowlist, uniqueness) live in `src/validate-delegates.ts` and run as part
of the test suite, so the guarantees that protected `delegates.txt` continue to protect the
structured data.

## Validation: reconstructing the sources

To prove the migration is faithful and complete, the datasets can rebuild their original sources.
This is a **one-time** check (run during generation, not a CI gate):

```sh
npm run validate
```

- `delegates.txt` is reconstructed **byte-for-byte** from `delegates.json`.
- The proposals are rendered to a canonical Markdown table that **re-parses to identical data**
  (round-trip stability). Byte-for-byte reproduction of the hand-formatted upstream Markdown is
  intentionally out of scope — see [`PLAN.md`](PLAN.md).

## Website

A static site under `site/` lets you browse, filter, and sort all three datasets. Build it locally:

```sh
npm run site:build   # builds the package, then the Astro site → site/dist
npm --prefix site run dev   # local dev server
```

It is deployed to GitHub Pages by `.github/workflows/deploy-site.yml` on every push to `main`.

## Technologies

- **TypeScript** authored, compiled with **`tsc`** to ESM `.js` + `.d.ts`.
- **ECMAScript modules** throughout; datasets imported via JSON import attributes.
- **Node's built-in test runner** with the **`tsx`** loader.
- **Astro** for the dependency-light static site (vanilla client-side filtering/sorting).
- **GitHub Actions** + **GitHub Pages** for CI and site deployment.
- **Volta** pins the Node/npm toolchain.

## Licence

[MIT](LICENSE)
