import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

interface FeedbackEntry {
  id: string;
  message: string;
  email?: string;
  source?: string;
  createdAt: number;
  ua?: string;
}

const TOKEN_KEY = "colour-pantry-admin-token";

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminFeedbackPage() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(TOKEN_KEY) || "";
  });
  const [tokenInput, setTokenInput] = useState("");
  const [entries, setEntries] = useState<FeedbackEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchFeedback = useCallback(
    async (withToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/feedback", {
          headers: { Authorization: `Bearer ${withToken}` },
        });
        if (res.status === 401) {
          window.localStorage.removeItem(TOKEN_KEY);
          setToken("");
          setEntries(null);
          setError("That token didn't work.");
          return;
        }
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || `Request failed (${res.status})`);
        }
        const data = (await res.json()) as { feedback: FeedbackEntry[] };
        setEntries(data.feedback);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load feedback.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (token) fetchFeedback(token);
  }, [token, fetchFeedback]);

  const onSubmitToken = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    window.localStorage.setItem(TOKEN_KEY, trimmed);
    setToken(trimmed);
    setTokenInput("");
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setEntries(null);
    setError(null);
  };

  const onDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Delete failed (${res.status})`);
      }
      setEntries((prev) => (prev || []).filter((e) => e.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="canvas-grain h-full overflow-y-auto scroll-thin">
        <div className="max-w-md mx-auto px-6 py-16">
          <Link
            to="/"
            className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            ← back home
          </Link>
          <div className="mt-8 p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark">
            <span className="eyebrow text-muted-light dark:text-muted-dark">admin</span>
            <h1 className="font-display font-medium text-2xl tracking-tight text-ink-light dark:text-ink-dark mt-1 mb-4">
              Sign in.
            </h1>
            <form onSubmit={onSubmitToken} className="space-y-3">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Admin token"
                className="w-full bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark rounded-md px-3 py-2 text-[14px] font-mono text-ink-light dark:text-ink-dark focus:border-ink-light dark:focus:border-ink-dark outline-none"
                autoFocus
              />
              {error && <div className="text-[12px] text-red-500">{error}</div>}
              <button
                type="submit"
                className="w-full btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90 justify-center"
              >
                Open dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-grain h-full overflow-y-auto scroll-thin">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            to="/"
            className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            ← back home
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchFeedback(token)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-full border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              onClick={logout}
              className="text-[11px] px-2.5 py-1 rounded-full text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-4">
          <span className="eyebrow text-muted-light dark:text-muted-dark">admin</span>
          <h1 className="font-display font-medium text-3xl tracking-tight text-ink-light dark:text-ink-dark display-tight mt-1">
            Feedback inbox.
          </h1>
          <p className="text-[13px] text-muted-light dark:text-muted-dark mt-2">
            {entries === null
              ? "—"
              : entries.length === 0
                ? "Nothing yet. Quiet pantry."
                : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}, newest first.`}
          </p>
        </div>

        {error && (
          <div className="mt-6 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-[13px]">
            {error}
          </div>
        )}

        {entries && entries.length > 0 && (
          <div className="mt-6 space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark p-4"
              >
                <header className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-baseline gap-2.5 text-[11px] font-mono text-muted-light dark:text-muted-dark">
                    <time>{formatTimestamp(entry.createdAt)}</time>
                    {entry.email && (
                      <>
                        <span aria-hidden>·</span>
                        <a
                          href={`mailto:${entry.email}`}
                          className="text-ink-light dark:text-ink-dark hover:underline"
                        >
                          {entry.email}
                        </a>
                      </>
                    )}
                    {entry.source && (
                      <>
                        <span aria-hidden>·</span>
                        <span title={entry.source} className="truncate max-w-[160px]">
                          {entry.source.replace(/^https?:\/\//, "")}
                        </span>
                      </>
                    )}
                  </div>
                  {confirmDelete === entry.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onDelete(entry.id)}
                        disabled={loading}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[11px] px-2 py-0.5 rounded-full text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(entry.id)}
                      className="text-[11px] px-2 py-0.5 rounded-full text-muted-light dark:text-muted-dark hover:text-red-500"
                    >
                      Delete
                    </button>
                  )}
                </header>
                <p className="text-[14px] leading-relaxed text-ink-light dark:text-ink-dark whitespace-pre-wrap">
                  {entry.message}
                </p>
                {entry.ua && (
                  <p className="text-[10px] font-mono text-muted-light dark:text-muted-dark mt-3 truncate">
                    {entry.ua}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
