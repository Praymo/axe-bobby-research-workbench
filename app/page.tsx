"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "today" | "selection" | "observation" | "notes" | "plans" | "review" | "evidence" | "rules" | "system";
type InsightEntry = {
  id: number; symbol: string; direction: string; title: string; source: string; angle: string;
  insight: string; judgment: string; confidence: string; createdAt: string;
  noteDate?: string; channel?: string; classificationStatus?: string;
};
type Factor = { name: string; value: number | string | null; unit: string; score: number | null; source: string; as_of: string; note: string };
type Dimension = { key: string; label: string; question: string; raw_score: number | null; status: string; state: string; factors: Factor[]; warnings: string[] };
type SixRow = {
  symbol: string; name: string; eligible: boolean; action: string; attention_score: number | null; position_score: number | null;
  weight_template: string; recommended_template: string; dimensions: Dimension[]; weighted_contributions: Record<string, number | null>;
  news_score: number; user_trigger_score: number; scope_liquidity_score: number | null; data_gaps: string[]; last_price: number | null;
  data_date: string | null; fundamental_profile: string; valuation_profile: string;
  benchmark: { broad_symbol: string; industry_symbol: string; benchmark_reason: string; peer_group: string[]; returns: Record<string, number | null> };
};
type RiskAdvice = { symbol: string; action: string; reference_price: number; stop_loss: number | null; take_profit_1: number | null; take_profit_2: number | null };
type StrategyAdvice = {
  advice_id: string; symbol: string; readiness: string; action: string; summary: string; confidence: string;
  reference_price: number | null; entry_zone_low: number | null; entry_zone_high: number | null;
  invalidation_price: number | null; review_target: number | null; reward_risk_to_review: number | null;
  starter_size_cap_pct: number; blockers: string[]; evidence: string[]; requires_confirmation: boolean; automatic_order: boolean;
};
type IntradaySignal = {
  signal_id: string; advice_id: string; symbol: string; observed_at: string; price: number; state: string;
  severity: string; message: string; requires_confirmation: boolean; automatic_order: boolean;
};
type ResearchPlaybook = {
  id: string; title: string; sources: string[]; observation: string; hypothesis: string; advanceRule: string;
  decisionChain: Array<{ stage: string; label: string; question: string; leading_indicators: string[]; confirmation: string[]; disconfirmers: string[]; cadence: string }>;
};
type WorkspaceData = {
  generatedAt?: string;
  snapshot: { id: string; generatedAt: string; maxMarketAgeCalendarDays: number; marketAgeCalendarDays: number | null; usableForConfirmation: boolean; reason: string };
  operationDay: string;
  market: { regime: string; data_status: string; data_date: string; new_long_allowed: boolean; position_cap_pct: number; risk_score: number };
  riskAdvice: RiskAdvice[];
  strategyAdvice: StrategyAdvice[];
  intradaySignals: IntradaySignal[];
  review: { counts: Record<string, number>; data_warnings: string[] };
  research: { collectionStatus: string; news: number; newNews: number; tradePlans: number };
  sixDimension: {
    modelVersion: string; activeTemplate: string; weightTemplates: Record<string, Record<string, number>>; fixedWeights: Record<string, number>;
    dimensions: { key: string; label: string; question: string }[]; selection: SixRow[]; rankedCount: number; blockedCount: number; dataPolicy: string;
  };
  shadowModel: { model_id?: string; role?: string; target?: string; validation_status?: string; promotion_status?: string; metrics?: Record<string, number | null>; gates?: Record<string, boolean>; coefficients?: Array<{ feature: string; coefficient: number }>; latest_scores?: Array<{ symbol: string; score: number; as_of: string }>; limitations?: string[]; methodology?: Record<string, string | number> };
  quantEvidence: {
    positioning?: { name: string; title: string; description: string };
    headlineMetrics?: Array<{ label: string; value: string; note: string }>;
    dataSource?: { provider: string; policy: string; status: string; quote?: Record<string, unknown>; candles?: Record<string, unknown> };
    evidence?: Array<{
      id: string; title: string; level: string; status: string; presentation: string; sample: string; conclusion: string;
      metrics: Array<{ label: string; value: string }>; limitations: string[]; gates?: Record<string, boolean>;
    }>;
    maturityScale?: Array<{ level: string; label: string }>;
  };
  researchPlaybooks: { version: string; asOf: string; policy: { role: string; production_score_effect: string; promotion_rule: string; decision_rule: string }; items: ResearchPlaybook[] };
  agent: { channels: Array<{ channel: string; status: string; role: string }>; events: Array<Record<string, unknown>>; eventCount: number; contract: string };
  operations: { timezone: string; automaticTrading: boolean; cycles: Array<{ id: string; time: string; name: string; status: string; outputs: string[] }>; workflow: string[] };
  dataArchitecture: { layers: Array<{ name: string; store: string; rule: string }> };
};

const empty: WorkspaceData = {
  snapshot: { id: "—", generatedAt: "", maxMarketAgeCalendarDays: 5, marketAgeCalendarDays: null, usableForConfirmation: false, reason: "尚未加载快照。" },
  operationDay: "—", market: { regime: "unknown", data_status: "MISSING", data_date: "—", new_long_allowed: false, position_cap_pct: 0, risk_score: 0 },
  riskAdvice: [], strategyAdvice: [], intradaySignals: [], review: { counts: {}, data_warnings: [] }, research: { collectionStatus: "UNKNOWN", news: 0, newNews: 0, tradePlans: 0 },
  sixDimension: { modelVersion: "—", activeTemplate: "balanced", weightTemplates: {}, fixedWeights: {}, dimensions: [], selection: [], rankedCount: 0, blockedCount: 0, dataPolicy: "" },
  shadowModel: {}, quantEvidence: {}, researchPlaybooks: { version: "—", asOf: "—", policy: { role: "THEMATIC_EVIDENCE", production_score_effect: "NONE", promotion_rule: "", decision_rule: "" }, items: [] }, agent: { channels: [], events: [], eventCount: 0, contract: "" },
  operations: { timezone: "Asia/Taipei", automaticTrading: false, cycles: [], workflow: [] }, dataArchitecture: { layers: [] },
};

const nav: { id: Tab; label: string; helper: string; mark: string }[] = [
  { id: "today", label: "今日", helper: "先决定做什么", mark: "01" },
  { id: "selection", label: "选股", helper: "关注分与位置分", mark: "02" },
  { id: "observation", label: "六维观察", helper: "拆开证据与假设", mark: "03" },
  { id: "notes", label: "研究笔记", helper: "归档观点与insight", mark: "04" },
  { id: "plans", label: "开仓计划", helper: "止损与风险边界", mark: "05" },
  { id: "review", label: "复盘", helper: "留下决策记录", mark: "06" },
  { id: "evidence", label: "量化证据", helper: "结果、等级与边界", mark: "07" },
  { id: "rules", label: "规则实验室", helper: "权重版本与审计", mark: "⚙" },
  { id: "system", label: "运营与数据", helper: "Agent、调度与存储", mark: "09" },
];

const templateNames: Record<string, string> = {
  balanced: "平衡环境", liquidity_stress: "流动性压力", industry_expansion: "行业扩张", catalyst_window: "催化窗口", valuation_repair: "估值修复",
};
const dimensionShort: Record<string, string> = { fundamental: "基本面", industry: "行业", pricing: "定价", macro: "宏观", valuation: "估值", catalyst: "催化" };

function fmt(value: number | null | undefined, digits = 1) {
  return value == null ? "—" : value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
}
function pct(value: number | null | undefined) { return value == null ? "—" : `${(value * 100).toFixed(1)}%`; }
function liveScore(row: SixRow, template: Record<string, number>, fixed: Record<string, number>) {
  if (!row.eligible) return null;
  const research = row.dimensions.reduce((sum, item) => sum + (item.raw_score ?? 0) * (template[item.key] ?? 0) / 100, 0);
  return research + row.news_score * (fixed.news ?? 10) / 100 + row.user_trigger_score * (fixed.user_trigger ?? 10) / 100 + (row.scope_liquidity_score ?? 0) * (fixed.scope_liquidity ?? 10) / 100;
}
function snapshotIsCurrent(data: WorkspaceData, now = new Date()) {
  if (!data.snapshot?.usableForConfirmation || data.market.data_status !== "FRESH") return false;
  const marketDate = new Date(`${data.market.data_date}T00:00:00Z`);
  if (Number.isNaN(marketDate.getTime())) return false;
  const ageDays = Math.floor((now.getTime() - marketDate.getTime()) / 86_400_000);
  return ageDays >= 0 && ageDays <= data.snapshot.maxMarketAgeCalendarDays;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("today");
  const [data, setData] = useState<WorkspaceData>(empty);
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [query, setQuery] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("balanced");
  const [review, setReview] = useState({ symbol: "", evidence: "", discipline: "", next: "", lesson: "" });
  const [toast, setToast] = useState("");
  const [note, setNote] = useState({ symbol: "", direction: "bullish", title: "", source: "", angle: "基本面改善", insight: "", judgment: "", confidence: "medium" });
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const [noteFilter, setNoteFilter] = useState({ direction: "", angle: "", symbol: "", search: "" });

  const load = async () => {
    const response = await fetch(`/workspace-data.json?t=${Date.now()}`);
    if (!response.ok) return;
    const payload = await response.json() as WorkspaceData;
    setData(payload); setActiveTemplate(payload.sixDimension.activeTemplate);
    if (!payload.sixDimension.selection.some(row => row.symbol === selectedSymbol)) setSelectedSymbol(payload.sixDimension.selection[0]?.symbol ?? "");
    fetch("/api/model-config").then(item => item.ok ? item.json() : null).then(item => item?.active?.template && setActiveTemplate(item.active.template)).catch(() => undefined);
  };
  useEffect(() => {
    void Promise.resolve().then(() => load()).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weights = useMemo(() => data.sixDimension.weightTemplates[activeTemplate] ?? data.sixDimension.weightTemplates.balanced ?? {},
    [activeTemplate, data.sixDimension.weightTemplates]);
  const rows = useMemo(() => data.sixDimension.selection
    .filter(row => `${row.symbol} ${row.name}`.toLowerCase().includes(query.toLowerCase()))
    .map(row => ({ ...row, attention_score: liveScore(row, weights, data.sixDimension.fixedWeights) }))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || (b.attention_score ?? -1) - (a.attention_score ?? -1)),
  [data, query, weights]);
  const selected = data.sixDimension.selection.find(row => row.symbol === selectedSymbol) ?? rows[0];
  const snapshotUsable = snapshotIsCurrent(data);
  const openSymbol = (symbol: string) => { setSelectedSymbol(symbol); setTab("observation"); };
  const flash = (message: string) => { setToast(message); setTimeout(() => setToast(""), 2200); };
  const saveReview = async () => {
    const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      tradeDate: data.operationDay, symbol: review.symbol, evidence: review.evidence, discipline: review.discipline,
      nextCheck: review.next, lesson: review.lesson,
    }) });
    const body = await response.json();
    if (!response.ok) return flash(body.error ?? "复盘保存失败");
    setReview({ symbol: "", evidence: "", discipline: "", next: "", lesson: "" }); flash("复盘已保存到统一记录");
  };
  const loadInsights = useCallback(async (params?: { direction?: string; angle?: string; symbol?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.direction) qs.set("direction", params.direction);
    if (params?.angle) qs.set("angle", params.angle);
    if (params?.symbol) qs.set("symbol", params.symbol);
    if (params?.search) qs.set("search", params.search);
    const response = await fetch(`/api/insights?${qs.toString()}`);
    if (!response.ok) return;
    const body = await response.json();
    setInsights(body.insights ?? []);
  }, []);
  const saveNote = async () => {
    const response = await fetch("/api/insights", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(note) });
    const body = await response.json();
    if (!response.ok) return flash(body.error ?? "保存失败");
    setNote({ symbol: "", direction: "bullish", title: "", source: "", angle: "基本面改善", insight: "", judgment: "", confidence: "medium" });
    flash("研究笔记已保存"); loadInsights(noteFilter);
  };
  const deleteInsight = async (id: number) => {
    await fetch(`/api/insights?id=${id}`, { method: "DELETE" });
    loadInsights(noteFilter);
  };
  useEffect(() => {
    if (tab !== "notes") return;
    void Promise.resolve().then(() => loadInsights()).catch(() => undefined);
  }, [tab, loadInsights]);

  return <main className="workspace-shell">
    <aside className="sidebar">
      <div className="identity"><div className="seal">AX</div><div><strong>Axe Bobby</strong><span>可审计量化投研系统</span></div></div>
      <nav>{nav.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><i>{item.mark}</i><span><b>{item.label}</b><small>{item.helper}</small></span></button>)}</nav>
      <div className="side-status"><span className={snapshotUsable ? "live" : "warn"}></span><div><b>{snapshotUsable ? "数据可用" : "数据已过期"}</b><small>{data.market.data_date} · 自动下单关闭</small></div></div>
    </aside>
    <section className="workspace-main">
      <header className="topbar"><div><span className="eyebrow">TAIPEI · {data.operationDay}</span><h1>{nav.find(item => item.id === tab)?.label}</h1></div><div className="top-actions"><label><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标的" /></label><button onClick={() => load()}>重新加载快照</button></div></header>
      {tab === "today" && <Today data={data} rows={rows} activeTemplate={activeTemplate} openSymbol={openSymbol} navigate={setTab} snapshotUsable={snapshotUsable} />}
      {tab === "selection" && <Selection rows={rows} activeTemplate={activeTemplate} openSymbol={openSymbol} flash={flash} />}
      {tab === "observation" && <Observation row={selected} weights={weights} />}
      {tab === "notes" && <Notes note={note} setNote={setNote} saveNote={saveNote} insights={insights} loadInsights={loadInsights} filter={noteFilter} setFilter={setNoteFilter} deleteInsight={deleteInsight} />}
      {tab === "plans" && <Plans data={data} rows={rows} openSymbol={openSymbol} flash={flash} snapshotUsable={snapshotUsable} />}
      {tab === "review" && <Review value={review} setValue={setReview} save={saveReview} day={data.operationDay} />}
      {tab === "evidence" && <QuantEvidence data={data.quantEvidence} />}
      {tab === "rules" && <Rules data={data} rows={rows} active={activeTemplate} setActive={setActiveTemplate} flash={flash} />}
      {tab === "system" && <System data={data} flash={flash} />}
      {toast && <div className="toast">{toast}</div>}
    </section>
  </main>;
}

function Today({ data, rows, activeTemplate, openSymbol, navigate, snapshotUsable }: { data: WorkspaceData; rows: SixRow[]; activeTemplate: string; openSymbol: (s: string) => void; navigate: (t: Tab) => void; snapshotUsable: boolean }) {
  const ranked = rows.filter(row => row.eligible);
  const near = ranked.filter(row => (row.position_score ?? 0) >= 60).slice(0, 4);
  const ready = snapshotUsable ? data.strategyAdvice.filter(item => item.readiness === "READY_FOR_CONFIRMATION") : [];
  const monitoring = data.strategyAdvice.filter(item => item.readiness === "MONITOR");
  const liveSignals = data.intradaySignals.filter(item => !["WATCHING", "MARKET_CLOSED", "BLOCKED"].includes(item.state));
  return <div className="today-grid">
    {!snapshotUsable && <section className="stale-banner"><strong>快照已失效，所有新计划确认已冻结。</strong><span>{data.snapshot.reason} 当前市场数据截止 {data.market.data_date}；请先运行主流水线生成新快照。</span></section>}
    <section className="decision-hero"><div><span className="eyebrow">TODAY&apos;S OPERATING BRIEF</span><h2>{ready.length ? `${ready.length} 个计划已通过闸门，等待你确认。` : "今天没有可直接带到券商的计划。"}</h2><p>可执行建议必须同时通过市场、六维证据、位置、止损和盈亏比检查；盘中信号只提示复核，不代替你的下单决定。</p><div className="hero-actions"><button onClick={() => navigate("plans")}>检查可执行计划</button><button className="ghost" onClick={() => navigate("selection")}>打开选股队列</button></div></div><div className="regime-card"><span>市场环境</span><strong>{data.market.regime.toUpperCase()}</strong><small>仓位上限 {data.market.position_cap_pct}% · {data.market.data_status}</small></div></section>
    <section className="metric-strip"><Metric label="等待确认" value={`${ready.length}`} note="不等于订单" /><Metric label="继续监控" value={`${monitoring.length}`} note="至少一项闸门未通过" /><Metric label="盘中触发" value={`${liveSignals.length}`} note="Telegram 同步提醒" /><Metric label="当前模板" value={templateNames[activeTemplate] ?? activeTemplate} note="需人工确认切换" /></section>
    <section className="panel wide"><div className="section-title"><div><span className="eyebrow">ATTENTION × POSITION</span><h3>优先复核</h3></div><button className="text-button" onClick={() => navigate("selection")}>查看全部 →</button></div><div className="priority-list">{(near.length ? near : ranked.slice(0, 4)).map((row, index) => <button key={row.symbol} onClick={() => openSymbol(row.symbol)}><span className="rank">0{index + 1}</span><strong>{row.symbol}<small>{row.name}</small></strong><div><b>{fmt(row.attention_score)}</b><small>关注分</small></div><div><b>{fmt(row.position_score)}</b><small>位置分</small></div><em>{row.benchmark.industry_symbol}</em></button>)}</div></section>
    <section className="panel"><span className="eyebrow">MODEL DISCIPLINE</span><h3>模型今天拒绝做什么</h3><p>{data.sixDimension.dataPolicy}</p><ul className="plain-list"><li>不把行业 Beta 当个股强度</li><li>不把成交量代理写成真实资金流</li><li>不以缺失值补 50 分</li></ul></section>
    <section className="panel"><span className="eyebrow">NEXT REVIEW</span><h3>今天只验证一件事</h3><p>{data.sixDimension.blockedCount ? `先处理 ${data.sixDimension.selection.find(row => !row.eligible)?.symbol ?? "首个标的"} 的单位或字段缺口。` : "从高关注、高位置标的中挑一个写开仓计划。"}</p><button className="text-button" onClick={() => navigate("review")}>写入复盘 →</button></section>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function Selection({ rows, activeTemplate, openSymbol, flash }: { rows: SixRow[]; activeTemplate: string; openSymbol: (s: string) => void; flash: (s: string) => void }) {
  const [onlyRanked, setOnlyRanked] = useState(true);
  const [watchSymbol, setWatchSymbol] = useState("");
  const [reason, setReason] = useState("");
  const visible = onlyRanked ? rows.filter(row => row.eligible) : rows;
  const addWatch = async () => {
    const response = await fetch("/api/watchlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ symbol: watchSymbol, reason, source: "网页工作区" }) });
    const body = await response.json();
    if (!response.ok) return flash(body.error ?? "加入失败");
    setWatchSymbol(""); setReason(""); flash("已保存首次关注理由");
  };
  return <div className="selection-page">
    <section className="selection-hero"><div><span className="eyebrow">AB-6D ATTENTION ENGINE</span><h2>先缩小注意力，再谈交易。</h2><p>当前使用“{templateNames[activeTemplate] ?? activeTemplate}”。原始六维分保持不变，只有贡献权重随已确认模板变化。</p></div><div className="dual-score"><div><strong>70</strong><span>六维研究权重</span></div><div><strong>30</strong><span>范围、新闻、用户触发</span></div></div></section>
    <section className="watch-capture"><div><span className="eyebrow">QUICK CAPTURE</span><h3>加入自选并保留最初理由</h3></div><input value={watchSymbol} onChange={event => setWatchSymbol(event.target.value.toUpperCase())} placeholder="Ticker" /><input value={reason} onChange={event => setReason(event.target.value)} placeholder="为什么今天注意到它？" /><button onClick={addWatch}>加入自选</button></section>
    <section className="panel table-panel"><div className="section-title"><div><span className="eyebrow">RANKED UNIVERSE</span><h3>选股队列</h3></div><div className="switch"><button className={onlyRanked ? "active" : ""} onClick={() => setOnlyRanked(true)}>正式排名</button><button className={!onlyRanked ? "active" : ""} onClick={() => setOnlyRanked(false)}>含数据缺口</button></div></div>
      <div className="score-table"><div className="score-row header"><span>标的</span><span>关注</span><span>位置</span><span>六维原始分</span><span>参照</span><span>状态</span></div>{visible.map(row => <button className="score-row" key={row.symbol} onClick={() => openSymbol(row.symbol)}><span><b>{row.symbol}</b><small>{row.name}</small></span><span className="score-number">{fmt(row.attention_score)}</span><span className="score-number muted-number">{fmt(row.position_score)}</span><span><DimensionStrip dimensions={row.dimensions} /></span><span><b>{row.benchmark.industry_symbol}</b><small>宽基 {row.benchmark.broad_symbol}</small></span><span><em className={row.eligible ? "valid" : "blocked"}>{row.eligible ? "可排名" : "数据阻断"}</em><small>{row.data_gaps[0] ?? row.recommended_template}</small></span></button>)}</div>
    </section>
  </div>;
}

function DimensionStrip({ dimensions }: { dimensions: Dimension[] }) { return <div className="dimension-strip">{dimensions.map(item => <i key={item.key} title={`${item.label}: ${fmt(item.raw_score)}`}><span style={{ height: `${item.raw_score ?? 0}%` }}></span><small>{dimensionShort[item.key]}</small></i>)}</div>; }

function Observation({ row, weights }: { row?: SixRow; weights: Record<string, number> }) {
  const [open, setOpen] = useState("fundamental");
  if (!row) return <div className="empty-state">还没有可观察标的。</div>;
  return <div className="observation-page">
    <section className="security-hero"><div><span className="eyebrow">SECURITY OBSERVATION</span><h2>{row.symbol}<small>{row.name}</small></h2><p>{row.benchmark.benchmark_reason}；同行组 {row.benchmark.peer_group.join(" · ") || "待配置"}</p></div><div className="hero-scores"><div><span>关注分</span><strong>{fmt(row.attention_score)}</strong></div><div><span>位置分</span><strong>{fmt(row.position_score)}</strong></div><div><span>数据状态</span><strong className={row.eligible ? "good-text" : "warn-text"}>{row.eligible ? "VALID" : "BLOCKED"}</strong></div></div></section>
    <section className="benchmark-board"><div><span>绝对 60D</span><strong>{pct(row.benchmark.returns.absolute_60d)}</strong></div><div><span>相对 {row.benchmark.broad_symbol}</span><strong>{pct(row.benchmark.returns.broad_60d)}</strong></div><div><span>相对 {row.benchmark.industry_symbol}</span><strong>{pct(row.benchmark.returns.industry_60d)}</strong></div><div><span>相对同行</span><strong>{pct(row.benchmark.returns.peer_60d)}</strong></div></section>
    {row.data_gaps.length > 0 && <section className="data-block"><strong>为什么不能排名</strong><ul>{row.data_gaps.map(item => <li key={item}>{item}</li>)}</ul></section>}
    <section className="dimension-cards">{row.dimensions.map(item => <button key={item.key} className={open === item.key ? "active" : ""} onClick={() => setOpen(item.key)}><span>{item.label}<small>权重 {weights[item.key] ?? 0}%</small></span><strong>{fmt(item.raw_score)}</strong><i><span style={{ width: `${item.raw_score ?? 0}%` }}></span></i><p>{item.question}</p><em>{item.state}</em></button>)}</section>
    {row.dimensions.filter(item => item.key === open).map(item => <section className="evidence-panel" key={item.key}><div className="section-title"><div><span className="eyebrow">RAW EVIDENCE · {item.status}</span><h3>{item.label}：{item.state}</h3></div><strong>{fmt(item.raw_score)}<small>未加权原始分</small></strong></div>{item.warnings.map(warning => <p className="warning-copy" key={warning}>{warning}</p>)}<div className="factor-table"><div className="factor-row header"><span>因子</span><span>原始值</span><span>因子分</span><span>来源 / 截止</span></div>{item.factors.length ? item.factors.map((factor, index) => <div className="factor-row" key={`${factor.name}-${index}`}><span><b>{factor.name}</b><small>{factor.note}</small></span><span>{fmt(typeof factor.value === "number" ? factor.value : null)} {typeof factor.value === "string" ? factor.value : factor.unit}</span><span>{fmt(factor.score)}</span><span><b>{factor.source || "—"}</b><small>{factor.as_of}</small></span></div>) : <div className="empty-state compact">当前没有可引用证据；系统没有补默认值。</div>}</div></section>)}
  </div>;
}

function Plans({ data, rows, openSymbol, flash, snapshotUsable }: { data: WorkspaceData; rows: SixRow[]; openSymbol: (s: string) => void; flash: (s: string) => void; snapshotUsable: boolean }) {
  const mapped = data.strategyAdvice
    .map(plan => ({ plan, row: rows.find(item => item.symbol === plan.symbol), signal: data.intradaySignals.find(item => item.advice_id === plan.advice_id) }))
    .sort((a, b) => ({ READY_FOR_CONFIRMATION: 0, MONITOR: 1, BLOCKED: 2 }[a.plan.readiness] ?? 3) - ({ READY_FOR_CONFIRMATION: 0, MONITOR: 1, BLOCKED: 2 }[b.plan.readiness] ?? 3))
    .slice(0, 18);
  const decide = async (plan: StrategyAdvice, decision: "CONFIRMED" | "REJECTED") => {
    if (decision === "CONFIRMED" && !snapshotUsable) return flash("快照已过期；请先运行主流水线刷新数据");
    const response = await fetch("/api/agent/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      event_key: crypto.randomUUID(), channel: "WEB", event_type: "DECISION_CONFIRMATION", suggested_area: "开仓计划",
      raw_text: `${decision === "CONFIRMED" ? "确认复核" : "否决"} ${plan.symbol} 策略建议 ${plan.advice_id}；这不是下单指令。`,
      source: plan.advice_id, occurred_at: new Date().toISOString(), workflow_status: decision, requires_confirmation: false,
    }) });
    const body = await response.json();
    if (!response.ok) return flash(body.error ?? "决定保存失败");
    flash(decision === "CONFIRMED" ? "已确认进入人工执行清单；系统不会自动下单" : "已否决并写入统一记录");
  };
  return <div className="plans-page">{!snapshotUsable && <section className="stale-banner"><strong>过期快照只允许查看与否决。</strong><span>确认按钮已冻结；先运行主流水线刷新行情和策略建议。</span></section>}<section className="plans-hero"><div><span className="eyebrow">MANUAL EXECUTION ONLY</span><h2>建议先过闸门，再由你确认。</h2><p>READY 才能进入人工执行清单；MONITOR 和 BLOCKED 只给盘中观察条件。网页确认与 Telegram /confirm 都只写记录，不连接券商。</p></div><div className="safety-stamp">NO<br/>AUTO<br/>ORDER</div></section><div className="plan-grid">{mapped.map(({ plan, row, signal }) => <article className={`readiness-${plan.readiness.toLowerCase()}`} key={plan.advice_id}><div><strong>{plan.symbol}</strong><em>{plan.readiness}</em></div><p>{plan.summary}</p><dl><div><dt>复核区间</dt><dd>{fmt(plan.entry_zone_low, 2)}–{fmt(plan.entry_zone_high, 2)}</dd></div><div><dt>证伪价</dt><dd>{fmt(plan.invalidation_price, 2)}</dd></div><div><dt>首个复核目标</dt><dd>{fmt(plan.review_target, 2)}</dd></div></dl><div className="plan-score"><span>盈亏比 {fmt(plan.reward_risk_to_review, 2)}</span><span>关注 {fmt(row?.attention_score)}</span><span>位置 {fmt(row?.position_score)}</span><span>试仓上限 {fmt(plan.starter_size_cap_pct, 1)}%</span></div>{signal && <div className={`signal-line signal-${signal.severity.toLowerCase()}`}><b>{signal.state}</b><span>{signal.message}</span></div>}{plan.blockers.length > 0 && <small>未通过：{plan.blockers.join("；")}</small>}<div className="plan-actions"><button onClick={() => openSymbol(plan.symbol)}>复核六维证据</button><button disabled={!snapshotUsable || plan.readiness !== "READY_FOR_CONFIRMATION"} onClick={() => decide(plan, "CONFIRMED")}>确认复核</button><button className="danger" onClick={() => decide(plan, "REJECTED")}>否决</button></div><small>Telegram：/confirm {plan.advice_id} 或 /reject {plan.advice_id}</small></article>)}</div></div>;
}

function Review({ value, setValue, save, day }: { value: Record<string, string>; setValue: (v: Record<string, string>) => void; save: () => void; day: string }) {
  const [history, setHistory] = useState<Array<Record<string, string | number>>>([]);
  useEffect(() => { void fetch("/api/reviews").then(item => item.json()).then(body => setHistory(body.reviews ?? [])).catch(() => undefined); }, []);
  return <div className="review-page"><section className="review-hero"><span className="eyebrow">POST-TRADE / NO-TRADE REVIEW</span><h2>{day}，把结果和过程分开。</h2><p>关注理由、交易理由和事后结论是三件不同的事。这里保存的是跨设备正式记录，不再只是当前浏览器草稿。</p></section><section className="review-editor"><label>标的（可空）<input value={value.symbol} onChange={event => setValue({ ...value, symbol: event.target.value.toUpperCase() })} placeholder="例如 NVDA" /></label><label>今天获得了什么新证据？<textarea value={value.evidence} onChange={event => setValue({ ...value, evidence: event.target.value })} /></label><div><label>纪律执行<textarea value={value.discipline} onChange={event => setValue({ ...value, discipline: event.target.value })} /></label><label>下一次只验证什么？<textarea value={value.next} onChange={event => setValue({ ...value, next: event.target.value })} /></label></div><label>偏差、运气与新感想<textarea value={value.lesson} onChange={event => setValue({ ...value, lesson: event.target.value })} /></label><button onClick={save}>保存正式复盘</button></section>    <section className="panel"><div className="section-title"><div><span className="eyebrow">D1 REVIEW LEDGER</span><h3>最近复盘记录</h3></div><span className="status-pill">{history.length} 条</span></div><div className="event-list">{history.length ? history.slice(0, 12).map(item => <article key={String(item.id)}><span>{String(item.tradeDate)} · {String(item.symbol || "全局")}</span><b>{String(item.evidence || item.lesson || "未写摘要")}</b><small>纪律：{String(item.discipline || "—")} · 下一验证：{String(item.nextCheck || "—")}</small></article>) : <p className="muted-copy">登录后保存的复盘会出现在这里。</p>}</div></section></div>;
}

function Notes({ note, setNote, saveNote, insights, loadInsights, filter, setFilter, deleteInsight }: {
  note: { symbol: string; direction: string; title: string; source: string; angle: string; insight: string; judgment: string; confidence: string };
  setNote: React.Dispatch<React.SetStateAction<{ symbol: string; direction: string; title: string; source: string; angle: string; insight: string; judgment: string; confidence: string }>>;
  saveNote: () => void;
  insights: InsightEntry[]; loadInsights: (p?: Record<string, string>) => void;
  filter: { direction: string; angle: string; symbol: string; search: string };
  setFilter: React.Dispatch<React.SetStateAction<{ direction: string; angle: string; symbol: string; search: string }>>;
  deleteInsight: (id: number) => void;
}) {
  const directionLabel: Record<string, string> = { bullish: "看多", bearish: "看空", neutral: "中性观察" };
  const directionEmoji: Record<string, string> = { bullish: "📈", bearish: "📉", neutral: "👀" };
  const angleOptions = ["基本面改善", "技术突破", "政策利好", "资金流向", "估值修复", "行业轮动", "财报超预期", "消息面催化", "宏观驱动", "情绪/泡沫", "结构突破", "风险提示"];
  const confidenceLabel: Record<string, string> = { high: "高信心", medium: "中等", low: "低信心" };
  const groupedInsights = insights.reduce<Record<string, InsightEntry[]>>((groups, item) => {
    const day = item.noteDate || item.createdAt.slice(0, 10);
    (groups[day] ??= []).push(item);
    return groups;
  }, {});

  const applyFilter = (key: string, value: string) => {
    const next = { ...filter, [key]: value };
    setFilter(next); loadInsights(next);
  };

  return <div className="notes-page">
    <section className="notes-hero"><div><span className="eyebrow">RESEARCH NOTEBOOK</span><h2>每条 insight 都值得被记录。</h2><p>刷到的信息、听到的观点、自己的判断——按日期和方向归档，积累可复盘的研究素材。这不是交易日记，是你的研究流水。</p></div><div className="notes-stats">{insights.length > 0 && <><strong>{insights.length}</strong><small>条笔记</small></>}</div></section>

    {/* Capture form */}
    <section className="notes-capture"><div><span className="eyebrow">NEW INSIGHT</span><h3>记录一条新洞察</h3></div>
      <div className="capture-grid">
        <label>标的 <input value={note.symbol} onChange={e => setNote({ ...note, symbol: e.target.value.toUpperCase() })} placeholder="NVDA" /></label>
        <label>方向 <select value={note.direction} onChange={e => setNote({ ...note, direction: e.target.value })}>
          <option value="bullish">📈 看多</option><option value="bearish">📉 看空</option><option value="neutral">👀 中性观察</option>
        </select></label>
        <label>角度 <select value={note.angle} onChange={e => setNote({ ...note, angle: e.target.value })}>
          {angleOptions.map(a => <option key={a} value={a}>{a}</option>)}
        </select></label>
        <label>信心 <select value={note.confidence} onChange={e => setNote({ ...note, confidence: e.target.value })}>
          {Object.entries(confidenceLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></label>
        <label className="wide">标题 <input value={note.title} onChange={e => setNote({ ...note, title: e.target.value })} placeholder="一句话总结这条 insight" /></label>
        <label className="wide">来源 <input value={note.source} onChange={e => setNote({ ...note, source: e.target.value })} placeholder="URL / 报告名称 / 谁说的" /></label>
        <label className="wide">洞察内容（你看到/听到了什么）<textarea value={note.insight} onChange={e => setNote({ ...note, insight: e.target.value })} placeholder="尽量忠实还原原始信息，不要夹带主观加工。" /></label>
        <label className="wide">你的判断（当下你怎么想的）<textarea value={note.judgment} onChange={e => setNote({ ...note, judgment: e.target.value })} placeholder="这是主观判断区。正确的、错误的都可以，重要的是记录当下的推理。" /></label>
      </div>
      <button onClick={saveNote} className="save-btn">保存研究笔记</button>
    </section>

    {/* Filter bar */}
    <section className="notes-filter"><div className="filter-row">
      <select value={filter.direction} onChange={e => applyFilter("direction", e.target.value)}>
        <option value="">全部方向</option><option value="bullish">📈 看多</option><option value="bearish">📉 看空</option><option value="neutral">👀 中性</option>
      </select>
      <select value={filter.angle} onChange={e => applyFilter("angle", e.target.value)}>
        <option value="">全部角度</option>{angleOptions.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <input value={filter.symbol} onChange={e => applyFilter("symbol", e.target.value.toUpperCase())} placeholder="筛选标的" />
      <input value={filter.search} onChange={e => applyFilter("search", e.target.value)} placeholder="搜索内容" />
    </div></section>

    {/* Browse list */}
    <section className="notes-list">
      {insights.length === 0 ? (
        <div className="empty-state">还没有研究笔记。上面记录你的第一条 insight！</div>
      ) : (
        <div className="notes-groups">
          {Object.entries(groupedInsights).map(([day, items]) => <section className="notes-day" key={day}>
            <div className="notes-day-title"><strong>{day}</strong><span>{items.length} 条 · 看多 {items.filter(item => item.direction === "bullish").length} · 看空 {items.filter(item => item.direction === "bearish").length} · 中性 {items.filter(item => item.direction === "neutral").length}</span></div>
            <div className="notes-grid">{items.map(item => (
            <article key={item.id} className={`note-card direction-${item.direction}`}>
              <div className="note-header">
                <span className="note-direction">{directionEmoji[item.direction] || ""} {directionLabel[item.direction] || item.direction}</span>
                <strong className="note-symbol">{item.symbol}</strong>
                <span className="note-confidence">{confidenceLabel[item.confidence] || item.confidence}{item.classificationStatus === "NEEDS_REVIEW" ? " · 待复核" : ""}</span>
              </div>
              {item.title && <h4 className="note-title">{item.title}</h4>}
              <div className="note-meta">
                {item.angle && <span className="note-angle">{item.angle}</span>}
                {item.source && <span className="note-source">📎 {item.source.length > 50 ? item.source.slice(0, 50) + "…" : item.source}</span>}
              </div>
              {item.insight && <div className="note-body"><span className="label">洞察</span><p>{item.insight}</p></div>}
              {item.judgment && <div className="note-body judgment"><span className="label">判断</span><p>{item.judgment}</p></div>}
              <div className="note-footer">
                <time>{item.channel || "WEB"} · {new Date(item.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</time>
                <button className="delete-btn" onClick={() => { if (confirm("确定删除这条笔记？")) deleteInsight(item.id); }}>删除</button>
              </div>
            </article>
            ))}</div>
          </section>)}
        </div>
      )}
    </section>
  </div>;
}

function QuantEvidence({ data }: { data: WorkspaceData["quantEvidence"] }) {
  const source = data.dataSource;
  const quoteAvailable = source?.quote?.status === "AVAILABLE";
  const candlesAvailable = source?.candles?.status === "AVAILABLE";
  return <div className="evidence-page">
    <section className="evidence-hero">
      <div><span className="eyebrow">{data.positioning?.name ?? "QUANT EVIDENCE"}</span><h2>{data.positioning?.title ?? "量化证据与研究边界"}</h2><p>{data.positioning?.description ?? "所有结果都绑定样本、成熟度和限制条件。"}</p></div>
      <div className={`source-orb ${candlesAvailable ? "ready" : "limited"}`}><span>正式行情口径</span><strong>{source?.provider ?? "Finnhub"}</strong><small>{quoteAvailable ? "实时报价可用" : "实时报价未验证"} · {candlesAvailable ? "历史K线可用" : "历史K线受限"}</small></div>
    </section>
    <section className="metric-strip">{(data.headlineMetrics ?? []).map(item => <Metric key={item.label} label={item.label} value={item.value} note={item.note} />)}</section>
    <section className="source-policy"><div><span className={quoteAvailable ? "live-dot" : "wait-dot"}></span><strong>实时报价</strong><small>{quoteAvailable ? "AVAILABLE" : "NOT CHECKED"}</small></div><div><span className={candlesAvailable ? "live-dot" : "wait-dot"}></span><strong>历史日线</strong><small>{candlesAvailable ? "AVAILABLE" : "套餐权限不足，正式回测阻断"}</small></div><p>{source?.policy}</p></section>
    <section className="evidence-grid">{(data.evidence ?? []).map(item => <article key={item.id} className={`evidence-card presentation-${item.presentation.toLowerCase()}`}><div className="evidence-card-head"><span>{item.level}</span><em>{item.status}</em></div><h3>{item.title}</h3><small>{item.sample}</small><div className="evidence-metrics">{item.metrics.map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div><p>{item.conclusion}</p>{item.gates && <div className="gate-list">{Object.entries(item.gates).map(([label, passed]) => <span key={label} className={passed ? "pass" : "fail"}>{passed ? "✓" : "×"} {label.replaceAll("_", " ")}</span>)}</div>}<ul>{item.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul><footer>{item.presentation === "PRIMARY" ? "主证据" : item.presentation === "SECONDARY" ? "辅助证据" : "仅展示架构"}</footer></article>)}</section>
    <section className="maturity-scale"><div><span className="eyebrow">VALIDATION LADDER</span><h3>研究成熟度不是一个“有效/无效”开关</h3></div>{(data.maturityScale ?? []).map(item => <div key={item.level}><strong>{item.level}</strong><span>{item.label}</span></div>)}</section>
  </div>;
}

function Rules({ data, rows, active, setActive, flash }: { data: WorkspaceData; rows: SixRow[]; active: string; setActive: (v: string) => void; flash: (s: string) => void }) {
  const [preview, setPreview] = useState(active);
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<Array<Record<string, string | number>>>([]);
  const [experimentReason, setExperimentReason] = useState("");
  const currentWeights = data.sixDimension.weightTemplates[active] ?? {};
  const previewWeights = data.sixDimension.weightTemplates[preview] ?? {};
  const topChanges = rows.filter(row => row.eligible).map(row => ({ symbol: row.symbol, before: liveScore(row, currentWeights, data.sixDimension.fixedWeights) ?? 0, after: liveScore(row, previewWeights, data.sixDimension.fixedWeights) ?? 0 })).sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before)).slice(0, 6);
  useEffect(() => { void fetch("/api/model-config").then(item => item.json()).then(body => setHistory(body.history ?? [])).catch(() => undefined); }, []);
  const activate = async () => {
    const response = await fetch("/api/model-config", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ template: preview, reason }) });
    const body = await response.json();
    if (!response.ok) return flash(body.error ?? "确认失败");
    setActive(preview); setReason(""); flash("个人界面预览已保存；Python 正式模型未改变");
  };
  const reviewExperiment = async (decision: string) => {
    const response = await fetch("/api/experiments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ modelId: data.shadowModel.model_id, decision, reason: experimentReason, metrics: data.shadowModel.metrics }) });
    const body = await response.json();
    if (!response.ok) return flash(body.error ?? "实验评审保存失败");
    setExperimentReason(""); flash("影子实验结论已保存；不会自动进入生产模型");
  };
  const metrics = data.shadowModel.metrics ?? {};
  return <div className="rules-page">
    <section className="rules-hero"><div><span className="eyebrow">VERSIONED MODEL CONTROL</span><h2>允许试，但不允许假装已经上线。</h2><p>网页权重只做个人界面预览并保留理由，不会改写 Python 正式配置或既有策略建议；统计模型永远先待在影子区。</p></div><div><span>正式快照模型</span><strong>{data.sixDimension.modelVersion}</strong><small>界面预览：{templateNames[active] ?? active}</small></div></section>
    <section className="template-grid">{Object.entries(data.sixDimension.weightTemplates).map(([key, weights]) => <button key={key} className={preview === key ? "active" : ""} onClick={() => setPreview(key)}><span>{templateNames[key] ?? key}{active === key && <em>当前</em>}</span><div>{Object.entries(weights).map(([dimension, weight]) => <i key={dimension}><small>{dimensionShort[dimension]}</small><b>{weight}</b><span style={{ height: `${weight * 4}%` }}></span></i>)}</div></button>)}</section>
    <section className="rule-compare"><div><span className="eyebrow">WEIGHT PREVIEW</span><h3>如果预览“{templateNames[preview] ?? preview}”</h3><div className="change-list">{topChanges.map(item => <div key={item.symbol}><b>{item.symbol}</b><span>{item.before.toFixed(1)}</span><i>→</i><strong>{item.after.toFixed(1)}</strong><em className={item.after >= item.before ? "up" : "down"}>{item.after >= item.before ? "+" : ""}{(item.after - item.before).toFixed(1)}</em></div>)}</div></div><div className="activation-box"><label>为什么要保存这个预览？<textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="记录观察、假设和试验理由" /></label><button disabled={preview === active || !reason.trim()} onClick={activate}>保存个人预览</button><small>只影响当前网页排名视图；正式配置与策略建议不会被改写。</small></div></section>
    <section className="playbook-lab"><div className="section-title"><div><span className="eyebrow">THEMATIC RESEARCH PLAYBOOKS</span><h3>报告先形成可证伪的研究链，不直接变成分数</h3><p>{data.researchPlaybooks.policy.decision_rule}</p></div><span className="status-pill">生产评分影响：{data.researchPlaybooks.policy.production_score_effect}</span></div><div className="playbook-grid">{data.researchPlaybooks.items.map(item => <article className="playbook-card" key={item.id}><div><span>{item.sources.join(" · ")}</span><strong>{item.title}</strong></div><p><b>观察</b>{item.observation}</p><p><b>假设</b>{item.hypothesis}</p><ol>{item.decisionChain.map(stage => <li key={stage.stage}><i>{stage.label}</i><span>{stage.question}</span><small>证伪优先：{stage.disconfirmers[0]}</small></li>)}</ol><footer>{item.advanceRule}</footer></article>)}</div><small className="playbook-policy">{data.researchPlaybooks.policy.promotion_rule}</small></section>
    <section className="shadow-lab"><div className="section-title"><div><span className="eyebrow">STRICT OUT-OF-SAMPLE LOOP</span><h3>影子统计模型</h3><p>{data.shadowModel.target} · {data.shadowModel.role}</p></div><span className={data.shadowModel.validation_status === "REVIEWABLE" ? "status-pill good" : "status-pill"}>{data.shadowModel.validation_status ?? "尚无结果"}</span></div><div className="metric-strip compact"><Metric label="样本外观察" value={String(metrics.oos_rows ?? "—")} note={`${metrics.folds ?? 0} 个扩展窗口`} /><Metric label="样本外 IC" value={metrics.oos_ic == null ? "—" : Number(metrics.oos_ic).toFixed(3)} note="预测与未来行业超额相关" /><Metric label="方向命中" value={metrics.direction_accuracy == null ? "—" : `${(Number(metrics.direction_accuracy) * 100).toFixed(1)}%`} note="不等于可交易收益" /><Metric label="头部组超额" value={metrics.top_quintile_forward_excess == null ? "—" : `${(Number(metrics.top_quintile_forward_excess) * 100).toFixed(1)}%`} note="样本内标的集中，需继续验证" /></div><div className="shadow-grid"><div><h4>验证闸门</h4>{Object.entries(data.shadowModel.gates ?? {}).map(([key, passed]) => <p key={key}><i className={passed ? "pass" : "fail"}></i>{key}<b>{passed ? "通过" : "未通过"}</b></p>)}</div><div><h4>可审计系数</h4>{(data.shadowModel.coefficients ?? []).map(item => <p key={item.feature}><span>{item.feature}</span><b>{item.coefficient.toFixed(4)}</b></p>)}</div><div><h4>最新影子输出</h4>{(data.shadowModel.latest_scores ?? []).slice(0, 7).map(item => <p key={item.symbol}><span>{item.symbol}</span><b>{item.score.toFixed(2)}%</b></p>)}</div></div><div className="experiment-review"><label>这次实验结论<textarea value={experimentReason} onChange={event => setExperimentReason(event.target.value)} placeholder="哪些结果可信，哪些机制还没有解释？" /></label><div><button disabled={!experimentReason.trim()} onClick={() => reviewExperiment("KEEP_SHADOW")}>继续影子观察</button><button disabled={!experimentReason.trim()} onClick={() => reviewExperiment("READY_FOR_REVIEW")}>标记可进入人工评审</button><button className="danger" disabled={!experimentReason.trim()} onClick={() => reviewExperiment("REJECT")}>否决实验</button></div><small>{data.shadowModel.promotion_status}。即使闸门全部通过，也不会自动加入正式关注分。</small></div></section>
    <section className="audit-grid"><div className="panel"><span className="eyebrow">DATA COVERAGE</span><h3>六维数据覆盖</h3>{data.sixDimension.dimensions.map(meta => { const valid = rows.filter(row => row.dimensions.find(item => item.key === meta.key)?.raw_score != null).length; return <p className="coverage-row" key={meta.key}><span>{meta.label}</span><i><b style={{ width: `${valid / Math.max(1, rows.length) * 100}%` }}></b></i><em>{valid}/{rows.length}</em></p>; })}</div><div className="panel"><span className="eyebrow">WEIGHT HISTORY</span><h3>正式版本记录</h3><div className="event-list">{history.length ? history.slice(0, 8).map(item => <article key={String(item.id)}><span>{String(item.createdAt)} · {String(item.status)}</span><b>{templateNames[String(item.template)] ?? String(item.template)}</b><small>{String(item.reason)}</small></article>) : <p className="muted-copy">第一次确认模板后，这里会保留版本和理由。</p>}</div></div></section>
    <section className="audit-policy"><span>数据纪律</span><p>{data.sixDimension.dataPolicy}</p><div><b>正式模型 / 影子实验分离</b><small>影子输出只用于验证假设，不参与选股、位置分或开仓计划。</small></div></section>
  </div>;
}

function System({ data, flash }: { data: WorkspaceData; flash: (s: string) => void }) {
  const [events, setEvents] = useState<Array<Record<string, unknown>>>(data.agent.events);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Array<Record<string, unknown>>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileSymbol, setFileSymbol] = useState("");
  useEffect(() => {
    void fetch("/api/agent/events").then(item => item.json()).then(body => {
      if (!body.events?.length) return;
      const merged = [...body.events, ...data.agent.events];
      setEvents(merged.filter((item, index) => merged.findIndex(other => String(other.eventKey ?? other.event_key ?? other.id) === String(item.eventKey ?? item.event_key ?? item.id)) === index));
    }).catch(() => undefined);
    void fetch("/api/files").then(item => item.json()).then(body => setFiles(body.files ?? [])).catch(() => undefined);
  }, [data.agent.events]);
  const capture = async () => {
    const response = await fetch("/api/agent/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event_key: crypto.randomUUID(), channel: "WEB", raw_text: text, source: "网页自由输入", occurred_at: new Date().toISOString(), requires_confirmation: true }) });
    const body = await response.json(); if (!response.ok) return flash(body.error ?? "记录失败"); setText(""); setEvents([body.event, ...events]); flash("内容已进入 Agent 统一收件箱");
  };
  const saveSnapshot = async () => {
    const template = data.sixDimension.activeTemplate; const weights = data.sixDimension.weightTemplates[template] ?? {};
    const response = await fetch("/api/snapshots", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operationDay: data.operationDay, modelVersion: data.sixDimension.modelVersion, weights, rows: data.sixDimension.selection }) });
    const body = await response.json(); if (!response.ok) return flash(body.error ?? "快照保存失败"); flash(body.created ? `已写入 ${body.created} 条评分历史` : "当天评分历史已经存在");
  };
  const upload = async () => {
    if (!file) return flash("先选择文件"); const form = new FormData(); form.set("file", file); form.set("symbol", fileSymbol); form.set("note", "网页研究附件");
    const response = await fetch("/api/files", { method: "POST", body: form }); const body = await response.json(); if (!response.ok) return flash(body.error ?? "上传失败"); setFiles([body.file, ...files]); setFile(null); setFileSymbol(""); flash("研究附件已归档");
  };
  return <div className="system-page"><section className="system-hero"><div><span className="eyebrow">ONE LEDGER · THREE INTERACTIVE SURFACES</span><h2>Telegram 捕捉与提醒，Codex 深度研究，网页正式确认。</h2><p>{data.agent.contract}</p></div><div className="cycle-clock">Asia/Taipei<strong>08:00 / 20:30</strong><small>盘中监控按市场状态触发 · 自动下单关闭</small></div></section><section className="channel-grid">{data.agent.channels.map(item => <article key={item.channel}><span className={item.status === "READY" ? "live-dot" : "wait-dot"}></span><div><strong>{item.channel}</strong><p>{item.role}</p><small>{item.status}</small></div></article>)}</section><section className="agent-console"><div><span className="eyebrow">UNSTRUCTURED INBOX</span><h3>像聊天一样丢进来</h3><p>Agent 自动建议放到选股、观察、计划、复盘或规则实验室；原文永久保留，仍需你确认。</p></div><textarea value={text} onChange={event => setText(event.target.value)} placeholder="例如：我看到 MU 有新的存储周期消息，先放到观察区，提醒我盘前看相对 SMH 表现。" /><button disabled={!text.trim()} onClick={capture}>交给 Agent 整理</button></section><section className="operation-grid"><div className="panel"><span className="eyebrow">DAILY OPERATIONS</span><h3>每日双循环</h3>{data.operations.cycles.map(item => <article className="cycle-row" key={item.id}><strong>{item.time}</strong><div><b>{item.name}</b><p>{item.outputs.join(" · ")}</p></div><em>{item.status}</em></article>)}</div><div className="panel"><span className="eyebrow">VALIDATION FLOW</span><h3>从观察到优化</h3><ol className="workflow-chain">{data.operations.workflow.map((item, index) => <li key={item}><i>{index + 1}</i><span>{item}</span></li>)}</ol></div></section><section className="architecture-panel"><div className="section-title"><div><span className="eyebrow">DATA ARCHITECTURE</span><h3>事实、证据、决策、事件、文件分层</h3></div><button className="text-button" onClick={saveSnapshot}>保存本次评分历史</button></div><div className="layer-grid">{data.dataArchitecture.layers.map((item, index) => <article key={item.name}><i>0{index + 1}</i><strong>{item.name}</strong><p>{item.store}</p><small>{item.rule}</small></article>)}</div></section><section className="operation-grid"><div className="panel"><span className="eyebrow">UNIFIED EVENT LEDGER</span><h3>最近 Agent 记录</h3><div className="event-list">{events.length ? events.slice(0, 15).map((item, index) => <article key={String(item.id ?? item.event_key ?? index)}><span>{String(item.occurredAt ?? item.occurred_at ?? item.createdAt ?? "")} · {String(item.channel ?? "")}</span><b>{String(item.suggestedArea ?? item.suggested_area ?? "待整理")} · {String(item.eventType ?? item.event_type ?? "INBOX_NOTE")}</b><small>{String(item.rawText ?? item.raw_text ?? "")}</small></article>) : <p className="muted-copy">新的 Codex、Telegram 和网页事件会汇总到这里。</p>}</div></div><div className="panel"><span className="eyebrow">R2 RESEARCH FILES</span><h3>研究附件</h3><div className="file-upload"><input value={fileSymbol} onChange={event => setFileSymbol(event.target.value.toUpperCase())} placeholder="Ticker（可空）" /><input type="file" onChange={event => setFile(event.target.files?.[0] ?? null)} /><button onClick={upload}>归档文件</button></div><div className="event-list">{files.slice(0, 8).map(item => <article key={String(item.id)}><span>{String(item.symbol || "全局")} · {(Number(item.sizeBytes ?? 0) / 1024).toFixed(0)} KB</span><b><a href={`/api/files?download=${item.id}`} target="_blank">{String(item.filename)}</a></b><small>{String(item.note ?? "")}</small></article>)}</div></div></section></div>;
}
