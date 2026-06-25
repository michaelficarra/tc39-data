/**
 * The schema for the aggregated TC39 datasets exported by this package.
 *
 * This file is the canonical, machine-checked definition of the data shapes.
 * The README links here rather than duplicating the types.
 */

/** An ECMA specification a proposal targets. */
export type Specification = "ECMA-262" | "ECMA-402" | "ECMA-404" | "ECMA-426"; // ECMA-404 (JSON) and ECMA-426 (Source Maps): no current proposals

/**
 * A proposal's maturity stage.
 *
 * `"0"`–`"4"` are the active maturity stages from the process document; the
 * terminal statuses replace the former single "inactive" bucket and are derived
 * from the rationale recorded when a proposal left the active process.
 * `"subsumed"` covers proposals that were merged into or subsumed by another.
 */
export type ProposalStage =
  | "0"
  | "1"
  | "2"
  | "2.7"
  | "3"
  | "4"
  | "rejected"
  | "withdrawn"
  | "abandoned"
  | "subsumed";

/** A single presentation of a proposal to the committee. */
export interface Presentation {
  /** Meeting month as `"YYYY-MM"` (occasionally `"YYYY-MM-DD"` when a day is recorded). */
  date: string;
  /** Link to the meeting notes for this presentation, when the source links one. */
  notesUrl?: string;
}

/** Test262 coverage, as surfaced in the Stage 3 / 2.7 proposal tables. */
export interface Test262Coverage {
  /** Whether any test262 tests / a feature flag exist for this proposal. */
  hasTests: boolean;
  /** Link to a test262 code search or test directory. */
  url?: string;
  /** The test262 feature-flag name shown in the cell, when present. */
  featureFlag?: string;
}

/** A TC39 delegate, referenced by their official abbreviation (a key in {@link DelegateMap}). */
export interface DelegateRef {
  kind: "delegate";
  /** The delegate's official abbreviation, e.g. `"MF"`. */
  abbreviation: string;
}

/** A non-delegate community contributor, identified by name. */
export interface CommunityMember {
  kind: "community";
  /** The contributor's full name. */
  name: string;
  /** The contributor's GitHub username, when known. */
  github?: string;
}

/**
 * An author, champion, or reviewer of a proposal: either a TC39 delegate
 * (referenced by abbreviation) or a community member (identified by name).
 */
export type Person = DelegateRef | CommunityMember;

/** A TC39 proposal across any specification and stage. */
export interface Proposal {
  /** Immutable kebab-case identifier, stable across renames. */
  id: string;
  /** Display name (may contain Markdown code formatting, as upstream). */
  name: string;
  /** Canonical proposal URL (GitHub repo or spec). Empty only for the rare repo-less proposal. */
  url: string;
  /** The specification this proposal targets. */
  specification: Specification;
  /** Current maturity stage or terminal status. */
  stage: ProposalStage;
  /** Authors of the proposal. */
  authors: Person[];
  /** Champions of the proposal. */
  champions: Person[];
  /** Committee presentations, in the order listed upstream (newest first). Empty ⇒ never presented. */
  presentations: Presentation[];
  /** Test262 coverage (Stage 3 / 2.7 only). */
  test262?: Test262Coverage;
  /** Stage 2.7 reviewers (Stage 2 table only). */
  stage27Reviewers?: Person[];
  /** Expected (or actual) ECMAScript publication year (Stage 4 only). */
  expectedPublicationYear?: number;
  /** Why the proposal is inactive (rejected / withdrawn / abandoned only). */
  rationale?: string;
}

/** A TC39 delegate's record, keyed in {@link DelegateMap} by their official abbreviation. */
export interface Delegate {
  /** The delegate's full name. */
  name: string;
  /**
   * The delegate's GitHub username, when known. Sourced from the tc39 GitHub
   * org's teams (the same membership used for {@link Delegate.affiliation}).
   */
  github?: string;
  /**
   * The delegate's affiliation — the TC39 member organisation (or "Invited
   * Expert") they represent, sourced from the tc39 GitHub org's teams. Absent
   * when the delegate could not be matched to a member-organisation team.
   */
  affiliation?: string;
}

/**
 * The on-disk / build shape of the delegates dataset: a plain record mapping an
 * official delegate abbreviation to the delegate's record. The runtime
 * `delegates` export wraps this as a `Map<string, Delegate>` keyed the same way.
 */
export type DelegateMap = Record<string, Delegate>; // { "AVP": { name: "Aakash Patel", affiliation: "…" }, ... }

/** One maturity stage defined by the TC39 process document. */
export interface ProcessStage {
  /** The stage number, `"0"`–`"4"`. */
  stage: string;
  /** A short description of what this stage's status means. */
  status: string;
  /** The criteria a proposal must meet to enter this stage. */
  entranceCriteria: string;
  /** What the committee and champions aim to accomplish during this stage. */
  purpose: string;
  /** What acceptance into this stage signifies, when the document states it separately. */
  acceptanceSignifies?: string;
}
