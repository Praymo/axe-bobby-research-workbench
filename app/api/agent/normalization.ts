import { and, eq } from "drizzle-orm";
import { workspaceEvents } from "../../../db/schema";

export type AgentPayload = {
  event_key?: string; channel?: string; event_type?: string; suggested_area?: string; symbols?: string[];
  raw_text?: string; source?: string; external_id?: string; occurred_at?: string; workflow_status?: string;
  requires_confirmation?: boolean;
};

export function normalizeTelegramText(text: string) {
  const upper = text.toUpperCase();
  const symbols = [...new Set((upper.match(/\$?[A-Z][A-Z0-9.-]{0,9}/g) ?? []).map(item => item.replace(/^\$/, ""))
    .filter(item => !["AI", "ETF", "SEC", "USD", "HTTP", "HTTPS"].includes(item)))];
  if (/复盘|卖出点|买入点|教训|纪律/.test(text)) return { eventType: "REVIEW_NOTE", area: "复盘", symbols };
  if (/开仓|止损|止盈|买入|卖出|做多|做空|交易|进场|抄底|反弹/.test(text)) return { eventType: "TRADE_IDEA", area: "开仓计划", symbols };
  if (/新闻|消息|财报|公告|推特|https?:/i.test(text)) return { eventType: "RESEARCH_NOTE", area: "六维观察", symbols };
  if (/关注|自选|看看|有意思/.test(text)) return { eventType: "WATCHLIST_ADD", area: "选股", symbols };
  if (/权重|因子|模型|规则/.test(text)) return { eventType: "MODEL_NOTE", area: "规则实验室", symbols };
  return { eventType: "INBOX_NOTE", area: "待整理", symbols };
}

export async function saveAgentEvent(db: ReturnType<typeof import("../../../db")["getDb"]> extends Promise<infer T> ? T : never, payload: AgentPayload, ownerEmail: string) {
  const eventKey = String(payload.event_key ?? "").trim();
  const rawText = String(payload.raw_text ?? "").trim();
  const channel = String(payload.channel ?? "CODEX").toUpperCase();
  if (!eventKey || !rawText || !["CODEX", "TELEGRAM", "WEB", "SYSTEM"].includes(channel)) throw new Error("INVALID_EVENT");
  const prior = await db.select().from(workspaceEvents).where(and(
    eq(workspaceEvents.ownerEmail, ownerEmail),
    eq(workspaceEvents.eventKey, eventKey),
  )).limit(1);
  if (prior.length) return { event: prior[0], created: false };
  const symbols = Array.isArray(payload.symbols) ? payload.symbols.map(item => String(item).toUpperCase()).slice(0, 20) : [];
  const [event] = await db.insert(workspaceEvents).values({
    ownerEmail, channel, eventKey, externalId: String(payload.external_id ?? ""),
    symbol: symbols[0] ?? "", symbolsJson: JSON.stringify(symbols),
    eventType: String(payload.event_type ?? "INBOX_NOTE"), suggestedArea: String(payload.suggested_area ?? "待整理"),
    rawText, source: String(payload.source ?? channel), originalReason: rawText, currentReason: rawText,
    triggerScore: payload.event_type === "WATCHLIST_ADD" ? 100 : 0,
    workflowStatus: String(payload.workflow_status ?? "INBOX"),
    requiresConfirmation: payload.requires_confirmation !== false,
    occurredAt: String(payload.occurred_at ?? new Date().toISOString()),
  }).returning();
  return { event, created: true };
}
