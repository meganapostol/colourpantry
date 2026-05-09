/**
 * Feedback intake.
 *
 * POST { message, email?, source?, website? } → stores in Vercel KV under
 *   feedback:item:<uuid>  → JSON of the entry
 *   feedback:zset         → sorted set of ids scored by createdAt
 *
 * Honeypot field "website" silently accepts and discards bot submissions.
 *
 * Required env vars (auto-set when you create a Vercel KV database and link
 * it to the project):
 *   KV_REST_API_URL
 *   KV_REST_API_TOKEN
 */

interface Payload {
  message?: string;
  email?: string;
  source?: string;
  website?: string;
}

interface FeedbackEntry {
  id: string;
  message: string;
  email?: string;
  source?: string;
  createdAt: number;
  ua?: string;
}

const MAX_MESSAGE = 5000;
const MAX_EMAIL = 200;
const MAX_SOURCE = 200;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function kvPipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("KV not configured");
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands.map((c) => c.map(String))),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`KV pipeline failed ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  return data.map((d) => d.result);
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  // Honeypot: silently accept and drop
  if (body.website && body.website.trim() !== "") {
    return json(200, { ok: true });
  }

  const message = (body.message || "").trim();
  if (!message) return json(400, { error: "Tell me what you'd like to say." });
  if (message.length > MAX_MESSAGE) return json(400, { error: "That's a lot. Try trimming it." });

  const email = (body.email || "").trim().slice(0, MAX_EMAIL);
  const source = (body.source || "").trim().slice(0, MAX_SOURCE);

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "That email address doesn't look right." });
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const entry: FeedbackEntry = {
    id,
    message,
    email: email || undefined,
    source: source || undefined,
    createdAt,
    ua: request.headers.get("user-agent") || undefined,
  };

  try {
    await kvPipeline([
      ["SET", `feedback:item:${id}`, JSON.stringify(entry)],
      ["ZADD", "feedback:zset", createdAt, id],
    ]);
  } catch (err) {
    console.error("feedback store failed", err);
    return json(502, { error: "Couldn't save right now. Try again in a minute." });
  }

  return json(200, { ok: true });
}
