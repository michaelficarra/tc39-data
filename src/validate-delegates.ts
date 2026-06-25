/**
 * Validation rules for the delegates dataset.
 *
 * These are ported, verbatim where it matters, from tc39/notes'
 * `scripts/check-delegates.mjs` (which validates the original `delegates.txt`).
 * They run over the structured {@link DelegateMap} and are exercised as
 * permanent invariant tests, so the guarantees that protected `delegates.txt`
 * continue to protect this dataset.
 */

import type { DelegateMap } from "./types.js";

/**
 * The fixed allowlist of legacy two-letter abbreviations, ported verbatim from
 * upstream. New delegate abbreviations must be three letters; only these
 * grandfathered codes may be two letters.
 */
export const TWO_LETTER_ABBRS: ReadonlySet<string> = new Set([
  "AC", "AH", "AK", "AR", "AS", "BB", "BE", "BG", "BM", "BN", "BS",
  "BT", "BZ", "CF", "CM", "CP", "DC", "DD", "DE", "DH", "DL", "DS",
  "DT", "EA", "EF", "ET", "EY", "FN", "FP", "GB", "GI", "GN", "GY",
  "IH", "IS", "IT", "JB", "JH", "JK", "JM", "JN", "JP", "JS", "JT",
  "KG", "KM", "KR", "KS", "LB", "LH", "LL", "LM", "MB", "MF", "MH",
  "MM", "MP", "MS", "NC", "NH", "NL", "NM", "OH", "PJ", "PL", "RB",
  "RH", "RW", "RX", "SC", "SK", "SM", "SP", "TC", "TD", "TS", "TW",
  "VM", "WH", "YK", "ZB",
]);

/**
 * Check a {@link DelegateMap} against the ported rules. Returns a list of human
 * readable problems; an empty list means the data is valid.
 */
/**
 * A plausible GitHub username: starts with an alphanumeric, then up to 38 more
 * alphanumerics or hyphens (≤ 39 total). Lenient about trailing/consecutive
 * hyphens, which current GitHub rules forbid but some legacy accounts use
 * (e.g. `o-`); the goal is to catch typos, not re-implement GitHub's validator.
 */
const GITHUB_USERNAME = /^[a-zA-Z\d][a-zA-Z\d-]{0,38}$/;

export function validateDelegates(delegates: DelegateMap): string[] {
  const errors: string[] = [];
  const seenNames = new Map<string, string>(); // name -> first abbreviation seen
  const seenGithub = new Map<string, string>(); // github -> first abbreviation seen

  for (const [abbr, { name, github, affiliation }] of Object.entries(delegates)) {
    // Abbreviation format: all uppercase Latin letters.
    if (!/^[A-Z]+$/.test(abbr)) {
      errors.push(`Abbreviation ${JSON.stringify(abbr)} must be all uppercase Latin letters.`);
      continue;
    }
    // Abbreviation length: exactly 2 or 3, with 2-letter codes restricted to the allowlist.
    if (abbr.length === 2) {
      if (!TWO_LETTER_ABBRS.has(abbr)) {
        errors.push(
          `2-letter abbreviation ${JSON.stringify(abbr)} is not in the allowlist. ` +
            `New delegate abbreviations must be three letters.`,
        );
      }
    } else if (abbr.length !== 3) {
      errors.push(
        `Invalid abbreviation ${JSON.stringify(abbr)}. New delegate abbreviations must be three letters.`,
      );
    }
    // Names must be unique. (Abbreviation uniqueness is enforced separately, against the
    // raw JSON source, by findDuplicateJsonKeys — see test/data-json.test.ts — because a
    // duplicate key is silently collapsed by the time the data reaches this parsed map.)
    if (!name || name.length === 0) {
      errors.push(`Abbreviation ${JSON.stringify(abbr)} has an empty name.`);
    } else if (seenNames.has(name)) {
      errors.push(
        `Duplicate name ${JSON.stringify(name)} for abbreviations ${JSON.stringify(seenNames.get(name))} and ${JSON.stringify(abbr)}.`,
      );
    } else {
      seenNames.set(name, abbr);
    }
    // Affiliation, when present, must be a non-empty string.
    if (affiliation !== undefined && affiliation.length === 0) {
      errors.push(`Abbreviation ${JSON.stringify(abbr)} has an empty affiliation.`);
    }
    // GitHub username, when present, must be well-formed and unique.
    if (github !== undefined) {
      if (!GITHUB_USERNAME.test(github)) {
        errors.push(`Abbreviation ${JSON.stringify(abbr)} has an invalid GitHub username ${JSON.stringify(github)}.`);
      } else if (seenGithub.has(github)) {
        errors.push(
          `Duplicate GitHub username ${JSON.stringify(github)} for abbreviations ${JSON.stringify(seenGithub.get(github))} and ${JSON.stringify(abbr)}.`,
        );
      } else {
        seenGithub.set(github, abbr);
      }
    }
  }

  return errors;
}

/** Throw if a {@link DelegateMap} violates any ported rule. */
export function assertValidDelegates(delegates: DelegateMap): void {
  const errors = validateDelegates(delegates);
  if (errors.length > 0) {
    throw new Error(`Invalid delegates data:\n  - ${errors.join("\n  - ")}`);
  }
}
