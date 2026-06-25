/**
 * `@tc39/data` — structured, typed datasets for TC39.
 *
 * Re-exports the schema types and the three datasets, each a `Map` keyed by its
 * natural identifier. See {@link ./types.ts} for the full schema.
 */

export * from "./types.js";
export { proposals } from "./proposals.js";
export { delegates } from "./delegates.js";
export { processStages } from "./process-stages.js";
