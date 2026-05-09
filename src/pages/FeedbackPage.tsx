import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";

type Status = "idle" | "sending" | "sent" | "error";

export function FeedbackPage() {
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg("Tell me what you'd like to say.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          email,
          website,
          source: typeof document !== "undefined" ? document.referrer || location.pathname : undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Couldn't save. Try again later.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't save. Try again later.");
    }
  };

  const sendAnother = () => {
    setMessage("");
    setEmail("");
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
          <span className="eyebrow text-muted-light dark:text-muted-dark">feedback</span>
          <h1 className="font-display font-medium text-3xl tracking-tight text-ink-light dark:text-ink-dark display-tight mt-1">
            Suggestions, bugs, ideas.
          </h1>
          <p className="text-[14px] text-muted-light dark:text-muted-dark mt-2 leading-relaxed max-w-lg">
            This is a one-way feedback box. Your message lands in a private inbox the
            operator reads. There's no auto-reply and you may not hear back, but every note
            shapes what gets built next.
          </p>
        </div>

        {status === "sent" ? (
          <div className="mt-8 p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark">
            <h2 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark">
              Thanks for that.
            </h2>
            <p className="text-[14px] text-muted-light dark:text-muted-dark mt-2">
              Your note is saved. It'll get read.
            </p>
            <button
              onClick={sendAnother}
              className="mt-4 text-[12px] underline hover:opacity-70 text-ink-light dark:text-ink-dark"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark block mb-1.5">
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="What'd be more useful? What's broken? What's missing?"
                className="w-full bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-md px-3 py-2 text-[14px] text-ink-light dark:text-ink-dark focus:border-ink-light dark:focus:border-ink-dark outline-none resize-y leading-relaxed placeholder:text-muted-light dark:placeholder:text-muted-dark"
                maxLength={5000}
              />
            </div>
            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark block mb-1.5">
                Your email{" "}
                <span className="lowercase tracking-normal text-[10px]">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-md px-3 py-2 text-[14px] text-ink-light dark:text-ink-dark focus:border-ink-light dark:focus:border-ink-dark outline-none"
                maxLength={200}
                autoComplete="email"
              />
              <p className="text-[10px] text-muted-light dark:text-muted-dark mt-1.5">
                Only if you want to be reachable about your suggestion. Leave blank to stay
                anonymous.
              </p>
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
                Stored privately, only the operator sees it.
              </span>
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90 disabled:opacity-50"
              >
                {status === "sending" ? "Saving…" : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
