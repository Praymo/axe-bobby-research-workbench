import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { reviewEntries } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ reviews: [] });
  const db = await getDb();
  const reviews = await db.select().from(reviewEntries).where(eq(reviewEntries.ownerEmail, user.email))
    .orderBy(desc(reviewEntries.tradeDate), desc(reviewEntries.updatedAt), desc(reviewEntries.id)).limit(100);
  return Response.json({ reviews });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const tradeDate = String(body.tradeDate ?? "").trim();
  const fields = {
    ownerEmail: user.email,
    tradeDate,
    symbol: String(body.symbol ?? "").trim().toUpperCase(),
    evidence: String(body.evidence ?? "").trim(),
    discipline: String(body.discipline ?? "").trim(),
    nextCheck: String(body.nextCheck ?? "").trim(),
    lesson: String(body.lesson ?? "").trim(),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate) || !Object.values(fields).some(value => value && value !== user.email && value !== tradeDate)) {
    return Response.json({ error: "日期有效且至少填写一项复盘内容。" }, { status: 400 });
  }
  const db = await getDb();
  const [created] = await db.insert(reviewEntries).values(fields).returning();
  return Response.json({ review: created }, { status: 201 });
}
