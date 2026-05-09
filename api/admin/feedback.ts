/**
 * Admin endpoint for the feedback box.
 *
 * Auth: Bearer token in Authorization header. Token must match ADMIN_TOKEN
 * env var on Vercel exactly. Anything else returns 401.
 *
 *   GET                  → list all feedback entries, newest first
 *   DELETE  ?id=<uuid>   → delete one entry by id
 *
 * Required env vars:
 *   ADMIN_TOKEN
 *   KV_REST_API_URL
 *   KV_REST_API_TOKEN
 */

interface FeedbackEntry {
  id: string;
  message: string;
  email?: string;
  source?: string;
  createdAt: number;
  ua?: string;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function authorize(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const presented = header.slice(7).trim();
  if (!presented) return false;
  return constantTimeEquals(presented, expected);
}

async function kvCommand(...args: (string | number)[]): Promise<unknown> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("KV not configured");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args.map(String)),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`KV failed ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as { result?: unknown };
  return data.result;
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
  const data = (await res.json()) as Array<{ result?: unknown }>;
  return data.map((d) => d.result);
}

export default async function handler(request: Request): Promise<Response> {
  if (!authorize(request)) {
    return json(401, { error: "Unauthorized" });
  }

  if (request.method === "GET") {
    let ids: string[] = [];
    try {
      const result = (await kvCommand("ZREVRANGE", "feedback:zset", 0, 500)) as
        | string[]
        | null;
      ids = result || [];
    } catch (err) {
      console.error("feedback list zrevrange failed", err);
      return json(502, { error: "Couldn't read storage." });
    }

    if (ids.length === 0) {
      return json(200, { feedback: [] });
    }

    let raw: unknown[];
    try {
      raw = await kvPipeline(ids.map((id) => ["GET", `feedback:item:${id}`]));
    } catch (err) {
      console.error("feedback list mget failed", err);
      return json(502, { error: "Couldn't read storage." });
    }

    const items: FeedbackEntry[] = [];
    for (const r of raw) {
      if (typeof r === "string") {
        try {
          items.push(JSON.parse(r) as FeedbackEntry);
        } catch {
          // skip malformed entries
        }
      }
    }

    return json(200, { feedback: items });
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id || !/^[a-f0-9-]{8,64}$/i.test(id)) {
      return json(400, { error: "Missing or malformed id." });
    }
    try {
      await kvPipeline([
        ["DEL", `feedback:item:${id}`],
        ["ZREM", "feedback:zset", id],
      ]);
    } catch (err) {
      console.error("feedback delete failed", err);
      return json(502, { error: "Couldn't delete." });
    }
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" });
}
