import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      setErrorMsg("Email and message are required.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Couldn't send. Try again later.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't send. Try again later.");
    }
  };

  const sendAnother = () => {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setWebsite("");
    setStatus("idle");
    setErrorMsg(null);
  };

  return (
    <div className="canvas-grain h-full overflow-y-auto scroll-thin">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          to="/"
          className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
        >
          ← back home
        </Link>
        <div className="mt-4">
          <span className="eyebrow text-muted-light dark:text-muted-dark">contact</span>
          <h1 className="font-display font-medium text-3xl tracking-tight text-ink-light dark:text-ink-dark display-tight mt-1">
            Get in touch.
          </h1>
          <p className="text-[14px] text-muted-light dark:text-muted-dark mt-2 leading-relaxed max-w-lg">
            Bug, idea, feature request, or just hello. Your message goes straight to my inbox.
            No newsletter, no list.
          </p>
        </div>

        {status === "sent" ? (
          <div className="mt-8 p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark">
            <h2 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark">
              Got it.
            </h2>
            <p className="text-[14px] text-muted-light dark:text-muted-dark mt-2">
              Message is in. I'll reply to {email} when I can.
            </p>
            <button
              onClick={sendAnother}
              className="mt-4 text-[12px] underline hover:opacity-70 text-ink-light dark:text-ink-dark"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark block mb-1.5">
                Name <span className="lowercase tracking-normal text-[10px]">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-md px-3 py-2 text-[14px] text-ink-light dark:text-ink-dark focus:border-ink-light dark:focus:border-ink-dark outline-none"
                maxLength={200}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark block mb-1.5">
                Your email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-md px-3 py-2 text-[14px] text-ink-light dark:text-ink-dark focus:border-ink-light dark:focus:border-ink-dark outline-none"
                maxLength={200}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark block mb-1.5">
                Subject{" "}
                <span className="lowercase tracking-normal text-[10px]">(optional)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-md px-3 py-2 text-[14px] text-ink-light dark:text-ink-dark focus:border-ink-light dark:focus:border-ink-dark outline-none"
                maxLength={200}
              />
            </div>
            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark block mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-md px-3 py-2 text-[14px] text-ink-light dark:text-ink-dark focus:border-ink-light dark:focus:border-ink-dark outline-none resize-y leading-relaxed"
                maxLength={5000}
              />
            </div>

            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            {status === "error" && errorMsg && (
              <div className="text-[12px] text-red-500" role="alert">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-muted-light dark:text-muted-dark">
                One inbox, no auto-reply, no list.
              </span>
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90 disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
