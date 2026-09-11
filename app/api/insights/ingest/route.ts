import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { insightEntries } from "../../../../db/schema";

type IngestPayload = {
  note_key?: unknown; event_key?: unknown; note_date?: unknown; channel?: unknown;
  symbol?: unknown; direction?: unknown; title?: unknown; source?: unknown; angle?: unknown;
  insight?: unknown; judgment?: unknown; confidence?: unknown; classification_status?: unknown;
  raw_text?: unknown;
};

async function agentConfig() {
  const { env } = await import("cloudflare:workers");
  return {
    secret: String(env.AXE_AGENT_SECRET ?? ""),
    ownerEmail: String(env.AXE_OWNER_EMAIL ?? ""),
  };
}

async function sameSecret(left: string, right: string) {
  if (!left || !right) return false;
  const bytes = (value: string) => new TextEncoder().encode(value);
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", bytes(left)),
    crypto.subtle.digest("SHA-256", bytes(right)),
  ]);
  return new Uint8Array(leftHash).every((value, index) => value === new Uint8Array(rightHash)[index]);
}

export async function POST(request: Request) {
  const { secret, ownerEmail } = await agentConfig();
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!ownerEmail || !(await sameSecret(provided, secret))) {
    return Response.json({ error: "Agent 未授权。" }, { status: 401 });
  }

  const body = await request.json() as IngestPayload;
  const noteKey = String(body.note_key ?? "").trim();
  const noteDate = String(body.note_date ?? "").trim();
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const direction = String(body.direction ?? "").trim();
  const insight = String(body.insight ?? "").trim();
  if (!noteKey || !/^\d{4}-\d{2}-\d{2}$/.test(noteDate) || !symbol || !insight) {
    return Response.json({ error: "研究笔记字段不完整。" }, { status: 400 });
  }
  if (!["bullish", "bearish", "neutral"].includes(direction)) {
    return Response.json({ error: "方向字段无效。" }, { status: 400 });
  }

  const db = await getDb();
  const values = {
    ownerEmail,
    noteKey,
    eventKey: String(body.event_key ?? "").trim(),
    noteDate,
    channel: String(body.channel ?? "AGENT").trim().toUpperCase(),
    symbol,
    direction,
    title: String(body.title ?? "").trim(),
    source: String(body.source ?? "Axe Agent").trim(),
    angle: String(body.angle ?? "待分类").trim(),
    insight,
    judgment: String(body.judgment ?? "").trim(),
    confidence: ["high", "medium", "low"].includes(String(body.confidence ?? "")) ? String(body.confidence) : "low",
    classificationStatus: String(body.classification_status ?? "AUTO_CLASSIFIED").trim(),
    rawText: String(body.raw_text ?? insight).trim(),
  };
  const prior = await db.select().from(insightEntries).where(eq(insightEntries.noteKey, noteKey)).limit(1);
  if (prior.length) {
    const [updated] = await db.update(insightEntries).set(values).where(eq(insightEntries.noteKey, noteKey)).returning();
    return Response.json({ insight: updated, created: false, updated: true });
  }
  const [created] = await db.insert(insightEntries).values(values).returning();
  return Response.json({ insight: created, created: true }, { status: 201 });
}
