import data from "./data/proposals.json" with { type: "json" };
import type { Proposal } from "./types.js";

/** Every TC39 proposal (ECMA-262 and ECMA-402), keyed by immutable `id`. */
export const proposals: Map<string, Proposal> = new Map(
  (data as unknown as Proposal[]).map((proposal) => [proposal.id, proposal]),
);
