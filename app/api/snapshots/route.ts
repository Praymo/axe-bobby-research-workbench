import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { scoreSnapshots } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

type SnapshotRow = {
  symbol?: string; eligible?: boolean; attention_score?: number | null; position_score?: number | null;
  weight_template?: string; dimensions?: Array<{ key?: string; raw_score?: number | null }>; data_date?: string;
};

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ snapshots: [] });
  const db = await getDb();
  const snapshots = await db.select().from(scoreSnapshots).where(eq(scoreSnapshots.ownerEmail, user.email))
    .orderBy(desc(scoreSnapshots.operationDay), desc(scoreSnapshots.id)).limit(300);
  return Response.json({ snapshots });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });
  const body = await request.json() as { operationDay?: string; modelVersion?: string; weights?: Record<string, number>; rows?: SnapshotRow[] };
  const operationDay = String(body.operationDay ?? "");
  const modelVersion = String(body.modelVersion ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(operationDay) || !modelVersion || !Array.isArray(body.rows)) return Response.json({ error: "快照字段不完整。" }, { status: 400 });
  const db = await getDb();
  let created = 0;
  for (const row of body.rows.slice(0, 100)) {
    const symbol = String(row.symbol ?? "").toUpperCase();
    if (!symbol) continue;
    const prior = await db.select({ id: scoreSnapshots.id }).from(scoreSnapshots).where(and(
      eq(scoreSnapshots.ownerEmail, user.email), eq(scoreSnapshots.operationDay, operationDay),
      eq(scoreSnapshots.symbol, symbol), eq(scoreSnapshots.modelVersion, modelVersion),
    )).limit(1);
    if (prior.length) continue;
    const raw = Object.fromEntries((row.dimensions ?? []).map(item => [String(item.key), item.raw_score ?? null]));
    await db.insert(scoreSnapshots).values({
      ownerEmail: user.email, operationDay, symbol, modelVersion,
      weightTemplate: String(row.weight_template ?? "balanced"), rawScoresJson: JSON.stringify(raw),
      weightsJson: JSON.stringify(body.weights ?? {}),
      attentionScore: row.attention_score == null ? null : Math.round(row.attention_score * 100),
      positionScore: row.position_score == null ? null : Math.round(row.position_score * 100),
      eligible: Boolean(row.eligible), dataDate: String(row.data_date ?? ""),
    });
    created += 1;
  }
  return Response.json({ created }, { status: 201 });
}
