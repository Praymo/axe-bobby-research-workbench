import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { experimentReviews } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const decisions = new Set(["KEEP_SHADOW", "REJECT", "READY_FOR_REVIEW"]);

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ reviews: [] });
  const db = await getDb();
  const reviews = await db.select().from(experimentReviews)
    .where(eq(experimentReviews.ownerEmail, user.email))
    .orderBy(desc(experimentReviews.createdAt), desc(experimentReviews.id)).limit(50);
  return Response.json({ reviews });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });
  const body = await request.json() as { modelId?: string; decision?: string; reason?: string; metrics?: unknown };
  const modelId = String(body.modelId ?? "").trim();
  const decision = String(body.decision ?? "").trim();
  const reason = String(body.reason ?? "").trim();
  if (!modelId || !decisions.has(decision) || !reason) return Response.json({ error: "模型、评审决定和理由不能为空。" }, { status: 400 });
  const db = await getDb();
  const [created] = await db.insert(experimentReviews).values({
    ownerEmail: user.email, modelId, decision, reason, metricsJson: JSON.stringify(body.metrics ?? {}),
  }).returning();
  return Response.json({ review: created }, { status: 201 });
}
