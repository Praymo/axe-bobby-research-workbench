import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { researchFiles } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

type Bucket = {
  put(key: string, value: ArrayBuffer, options?: Record<string, unknown>): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
};

async function bucket() {
  const { env } = await import("cloudflare:workers");
  const value = (env as unknown as Record<string, unknown>).FILES as Bucket | undefined;
  if (!value) throw new Error("FILES binding unavailable");
  return value;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ files: [] });
  const db = await getDb();
  const id = Number(new URL(request.url).searchParams.get("download") ?? 0);
  if (id) {
    const rows = await db.select().from(researchFiles).where(and(eq(researchFiles.id, id), eq(researchFiles.ownerEmail, user.email))).limit(1);
    if (!rows.length) return new Response("Not found", { status: 404 });
    const object = await (await bucket()).get(rows[0].objectKey);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, { headers: { "content-type": object.httpMetadata?.contentType ?? rows[0].contentType, "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(rows[0].filename)}` } });
  }
  const files = await db.select().from(researchFiles).where(eq(researchFiles.ownerEmail, user.email))
    .orderBy(desc(researchFiles.createdAt), desc(researchFiles.id)).limit(100);
  return Response.json({ files });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0 || file.size > 10 * 1024 * 1024) return Response.json({ error: "请选择不超过 10MB 的文件。" }, { status: 400 });
  const symbol = String(form.get("symbol") ?? "").trim().toUpperCase();
  const note = String(form.get("note") ?? "").trim();
  const key = `${encodeURIComponent(user.email)}/${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await (await bucket()).put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
  const db = await getDb();
  const [created] = await db.insert(researchFiles).values({
    ownerEmail: user.email, objectKey: key, filename: file.name, contentType: file.type || "application/octet-stream",
    sizeBytes: file.size, symbol, note,
  }).returning();
  return Response.json({ file: created }, { status: 201 });
}
