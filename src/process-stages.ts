import data from "./data/process-stages.json" with { type: "json" };
import type { ProcessStage } from "./types.js";

/** The TC39 maturity stages (0–4) as defined by the process document, keyed by `stage`. */
export const processStages: Map<string, ProcessStage> = new Map(
  (data as unknown as ProcessStage[]).map((stage) => [stage.stage, stage]),
);
