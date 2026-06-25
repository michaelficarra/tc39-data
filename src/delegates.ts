import data from "./data/delegates.json" with { type: "json" };
import type { Delegate } from "./types.js";

/** Each official TC39 delegate abbreviation mapped to the delegate's record. */
export const delegates: Map<string, Delegate> = new Map(
  Object.entries(data as Record<string, Delegate>),
);
