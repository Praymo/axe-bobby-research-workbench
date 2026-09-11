import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("authenticated event and experiment reads are scoped to the current owner", async () => {
  const [eventsRoute, experimentsRoute] = await Promise.all([
    source("../app/api/agent/events/route.ts"),
    source("../app/api/experiments/route.ts"),
  ]);

  assert.match(
    eventsRoute,
    /\.where\(eq\(workspaceEvents\.ownerEmail,\s*user\.email\)\)/,
    "event reads must never return another owner's rows",
  );
  assert.match(
    experimentsRoute,
    /\.where\(eq\(experimentReviews\.ownerEmail,\s*user\.email\)\)/,
    "experiment reads must never return another owner's rows",
  );
});

test("agent event idempotency is isolated by owner and event key", async () => {
  const normalization = await source("../app/api/agent/normalization.ts");

  assert.match(
    normalization,
    /where\(and\(\s*eq\(workspaceEvents\.ownerEmail,\s*ownerEmail\),\s*eq\(workspaceEvents\.eventKey,\s*eventKey\),\s*\)\)/s,
    "the same event key from two owners must not collide",
  );
});
