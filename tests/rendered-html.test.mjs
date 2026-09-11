import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finance workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Axe Bobby · 可审计量化投研系统<\/title>/);
  assert.match(html, /选股/);
  assert.match(html, /六维观察/);
  assert.match(html, /开仓计划/);
  assert.match(html, /规则实验室/);
  assert.match(html, /运营与数据/);
  assert.match(html, /自动下单关闭/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships a current workspace snapshot, demos and social card", async () => {
  const [snapshotText, page, packageJson, og, tradingDemo, agentDemo] = await Promise.all([
    readFile(new URL("../public/workspace-data.json", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/og.png", import.meta.url)),
    readFile(new URL("../public/demos/trading-signal.html", import.meta.url), "utf8"),
    readFile(new URL("../public/demos/options-risk-agent.html", import.meta.url), "utf8"),
  ]);
  const snapshot = JSON.parse(snapshotText);
  assert.doesNotMatch(snapshotText, /\/Users\//);
  assert.equal(snapshot.market.data_status, "STALE");
  assert.equal(snapshot.snapshot.usableForConfirmation, false);
  assert.match(snapshot.snapshot.id, /^[a-f0-9]{16}$/);
  assert.ok(Array.isArray(snapshot.selection));
  assert.ok(snapshot.selection.length > 0);
  assert.equal(snapshot.sixDimension.modelVersion, "ab6d-2026.07-v1");
  assert.equal(snapshot.sixDimension.activeTemplate, "balanced");
  assert.equal(snapshot.sixDimension.selection.length, 30);
  assert.equal(snapshot.sixDimension.rankedCount, 25);
  assert.equal(snapshot.sixDimension.blockedCount, 5);
  const nvda = snapshot.sixDimension.selection.find((row) => row.symbol === "NVDA");
  const vst = snapshot.sixDimension.selection.find((row) => row.symbol === "VST");
  assert.equal(nvda.benchmark.broad_symbol, "SPY");
  assert.equal(nvda.benchmark.industry_symbol, "SMH");
  assert.equal(vst.benchmark.broad_symbol, "SPY");
  assert.equal(vst.benchmark.industry_symbol, "XLU");
  assert.equal(nvda.dimensions.length, 6);
  assert.equal(Object.values(snapshot.sixDimension.weightTemplates.balanced).reduce((a, b) => a + b, 0), 70);
  assert.equal(snapshot.shadowModel.role, "SHADOW_ONLY");
  assert.equal(snapshot.shadowModel.metrics.oos_rows, 600);
  assert.ok(snapshot.shadowModel.metrics.folds >= 4);
  assert.equal(snapshot.shadowModel.methodology.production_effect, "NONE");
  assert.equal(snapshot.agent.channels.find((item) => item.channel === "CODEX").status, "READY");
  assert.ok(
    ["READY", "CONFIGURED_OFFLINE"].includes(
      snapshot.agent.channels.find((item) => item.channel === "TELEGRAM").status,
    ),
  );
  assert.equal(snapshot.agent.channels.find((item) => item.channel === "WEB").status, "READY");
  assert.deepEqual(snapshot.agent.events, []);
  assert.ok(snapshot.agent.eventCount >= 0);
  assert.equal(snapshot.operations.automaticTrading, false);
  assert.equal(snapshot.quantEvidence.dataSource.provider, "Finnhub");
  assert.equal(snapshot.quantEvidence.dataSource.quote.status, "AVAILABLE");
  assert.equal(snapshot.quantEvidence.dataSource.candles.status, "UNAVAILABLE");
  assert.equal(snapshot.quantEvidence.evidence.find((item) => item.id === "ai-equity-five-layer").presentation, "ARCHITECTURE_ONLY");
  assert.equal(snapshot.researchPlaybooks.policy.production_score_effect, "NONE");
  assert.equal(snapshot.researchPlaybooks.items.length, 2);
  assert.deepEqual(snapshot.operations.cycles.map((item) => item.id), ["close", "premarket", "intraday"]);
  assert.equal(snapshot.strategyAdvice.length, 30);
  assert.ok(snapshot.intradaySignals.every((item) => item.automatic_order === false));
  assert.equal(snapshot.dataArchitecture.layers.length, 5);
  assert.equal(snapshot.lab.projects.length, 5);
  assert.equal(snapshot.lab.validation.length, 3);
  assert.equal(snapshot.lab.riskWindows.length, 7);
  assert.match(page, /workspace-data\.json/);
  assert.match(packageJson, /axe-bobby-workspace/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.ok(og.length > 100_000);
  assert.match(tradingDemo, /交易指导信号看板 Demo/);
  assert.match(agentDemo, /期权隐含风险 Agent 推送模拟/);
});
