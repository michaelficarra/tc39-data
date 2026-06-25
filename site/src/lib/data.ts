/**
 * Typed access to the canonical datasets for the site, plus small presentation
 * helpers. The JSON is imported directly from the repository's `src/data`.
 */

import proposalsJson from "../../../src/data/proposals.json";
import delegatesJson from "../../../src/data/delegates.json";
import stagesJson from "../../../src/data/process-stages.json";
import type { DelegateMap, Person, ProcessStage, Proposal } from "../../../src/types";

export const proposals = proposalsJson as unknown as Proposal[];
export const delegates = delegatesJson as DelegateMap;
export const processStages = stagesJson as unknown as ProcessStage[];

/** Sort order for stages and terminal statuses (used as a numeric sort key). */
export const STAGE_ORDER: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "2.7": 2.7,
  "3": 3,
  "4": 4,
  rejected: 5,
  withdrawn: 6,
  abandoned: 7,
  subsumed: 8,
};

/** Display name for a person (delegates resolve to their full name). */
export function personName(person: Person): string {
  return person.kind === "delegate"
    ? delegates[person.abbreviation]?.name ?? person.abbreviation
    : person.name;
}

/** Comma-joined display names for a list of people. */
export function peopleNames(people: Person[]): string {
  return people.map(personName).join(", ");
}

/** The most recent presentation date for a proposal, or `""` if never presented. */
export function lastPresented(proposal: Proposal): string {
  return proposal.presentations.map((p) => p.date).sort().at(-1) ?? "";
}

/** Escape HTML, then render `\`code\`` spans as `<code>` — for proposal names. */
export function formatNameHtml(name: string): string {
  return name
    .split("`")
    .map((part, i) => {
      const escaped = part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return i % 2 === 1 ? `<code>${escaped}</code>` : escaped;
    })
    .join("");
}
