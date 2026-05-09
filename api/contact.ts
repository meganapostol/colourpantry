/**
 * Contact form handler.
 *
 * Receives a JSON POST from /contact, validates, and forwards via Resend
 * to the address held in the CONTACT_EMAIL env var. The recipient is never
 * exposed to the client — neither in the request, the response, nor any
 * error path. Logs go to Vercel function logs only.
 *
 * Required env vars on Vercel:
 *   RESEND_API_KEY     — API key from resend.com
 *   CONTACT_EMAIL      — destination inbox (e.g. megan@example.com)
 *
 * Optional:
 *   CONTACT_FROM_EMAIL — sender shown on the email. Defaults to Resend's
 *                        test sender. Use a verified domain for production
 *                        (e.g. "Colour Pantry <hello@colourpantry.com>").
 */

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  // honeypot — should be empty for real users
  website?: string;
}

const MAX_NAME = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  // Honeypot: silently succeed for bots that fill the hidden field
  if (body.website && body.website.trim() !== "") {
    return json(200, { ok: true });
  }

  const email = (body.email || "").trim();
  const message = (body.message || "").trim();
  const name = (body.name || "").trim().slice(0, MAX_NAME);
  const subject = (body.subject || "").trim().slice(0, MAX_SUBJECT);

  if (!email || !message) {
    return json(400, { error: "Email and message are required." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "That email address doesn't look right." });
  }

  if (message.length > MAX_MESSAGE) {
    return json(400, { error: "Message is too long." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL;
  const fromEmail =
    process.env.CONTACT_FROM_EMAIL || "Colour Pantry <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
    console.error("Contact form not configured: missing RESEND_API_KEY or CONTACT_EMAIL");
    return json(500, { error: "Contact form is not configured yet. Try again later." });
  }

  const subjectLine = subject
    ? `[Colour Pantry] ${subject}`
    : "[Colour Pantry] New contact form message";

  const textBody = [
    `From: ${name || "(no name given)"} <${email}>`,
    "",
    message,
  ].join("\n");

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        reply_to: email,
        subject: subjectLine,
        text: textBody,
      }),
    });
  } catch (err) {
    console.error("Resend fetch threw", err);
    return json(502, { error: "Couldn't send right now. Try again in a minute." });
  }

  if (!resendResponse.ok) {
    const detail = await resendResponse.text().catch(() => "");
    console.error("Resend rejected the send", resendResponse.status, detail);
    return json(502, { error: "Couldn't send right now. Try again in a minute." });
  }

  return json(200, { ok: true });
}
