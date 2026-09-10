# Axe Bobby Research Workbench

## 中文定位

这是一个可离线运行的 Axe Bobby 投研规则演示工作台。它把研究评分、市场数据时效闸门、风险阻断和人工复核步骤放在一条可检查的路径里，帮助研究者回答：当前证据是否足够进入人工复核？哪些条件必须先修复？

发布版只使用内置合成数据。它不读取真实行情、研究持仓、账号或消息渠道，也不会自动下单。页面中的 `DEMO-A/B/C` 是合成案例，不代表任何真实标的或收益结论。

## English positioning

An offline, audit-friendly research workbench for showing how a small set of investment rules becomes a human-review decision. It exposes the research score, freshness gate, risk blockers, position cap, and review checklist in one compact flow.

The release ships synthetic cases only. It does not fetch market data, read portfolios, contact an account, or place orders. `DEMO-A/B/C` are synthetic examples and carry no performance claim.

## Run the demo

Requires Python 3.12 or a compatible Python 3 runtime. There are no third-party runtime dependencies.

```bash
python workbench.py
python -m unittest discover -s tests -v
```

The command prints JSON containing three paths:

- `CANDIDATE`: research and timing evidence pass the local thresholds, but `manual_review_required` remains true.
- `BLOCKED`: the market snapshot is stale, so new long risk is frozen even when the synthetic research score is strong.
- `BLOCKED`: the research vetoes include missing stop discipline and an overheated price/positioning combination.

Open `demo/index.html` directly in a browser for the same static, no-network overview. The page has no external assets or requests.

## Rule boundary

The code is a curated extraction of the parent project's research scorer, market freshness gate, and entry evidence contract. The seven buckets retain the source vocabulary, including `kol_heat`, `price_in_risk`, and `profit_taking_pressure`; the source's KOL heat cap remains 80. The full price-history feature engineering and live adapters are intentionally outside this release so the example stays dependency-closed and offline. `EntryEvidence` is a simplified demonstration input: it stands in for observations that the parent project normally derives from completed bars and is not the production entry scorer.

The decision loop is:

```text
synthetic research inputs
  -> seven weighted research buckets
  -> market freshness and regime gate
  -> closed-bar entry evidence
  -> blockers and position cap
  -> human review checklist
```

There is no claim that the score predicts returns. The output is a review aid with explicit data and discipline boundaries.

## Author contribution

The author defined the release requirements and guardrails. With Codex assistance, the rules were selectively extracted, synthetic cases were designed to expose candidate/stale/veto paths, and the boundary tests and offline release packaging were verified. The implementation keeps the source project's fail-closed behavior and does not imply trading performance.

## License

The original release code is provided under the MIT License; see [`LICENSE`](LICENSE). Use it as a demonstration and adapt it to your own review process. No investment advice is provided.
