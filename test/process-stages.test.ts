import { test } from "node:test";
import assert from "node:assert/strict";
import { processStages } from "../src/index.js";

test("the six maturity stages are present in order", () => {
  // The Map is keyed by stage id, in insertion (document) order.
  assert.deepEqual(
    [...processStages.keys()],
    ["0", "1", "2", "2.7", "3", "4"],
  );
});

test("every stage has a status, entrance criteria, and purpose", () => {
  for (const stage of processStages.values()) {
    assert.ok(stage.status.length > 0, `stage ${stage.stage}: empty status`);
    assert.ok(stage.entranceCriteria.length > 0, `stage ${stage.stage}: empty entrance criteria`);
    assert.ok(stage.purpose.length > 0, `stage ${stage.stage}: empty purpose`);
  }
});
