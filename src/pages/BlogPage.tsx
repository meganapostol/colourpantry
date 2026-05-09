import { Link } from "react-router-dom";
import { getPublishedPosts } from "../lib/blogPosts";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BlogPage() {
  const sorted = getPublishedPosts().sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <div className="canvas-grain h-full overflow-y-auto scroll-thin">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link
          to="/"
          className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
        >
          ← back home
        </Link>
        <div className="mt-4">
          <span className="eyebrow text-muted-light dark:text-muted-dark">notes</span>
          <h1 className="font-display font-medium text-3xl tracking-tight text-ink-light dark:text-ink-dark display-tight mt-1">
            Notes from the pantry.
          </h1>
          <p className="text-[13px] text-muted-light dark:text-muted-dark mt-2 max-w-xl leading-relaxed">
            Short, practical writing on colour theory, accessibility, and palette workflow.
            New posts when there's something worth saying.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {sorted.map((post) => (
            <article
              key={post.slug}
              className="border-b border-line-light dark:border-line-dark pb-6 last:border-b-0"
            >
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="flex items-baseline gap-3 text-[11px] font-mono text-muted-light dark:text-muted-dark mb-1.5">
                  <time>{formatDate(post.publishedAt)}</time>
                  <span aria-hidden>·</span>
                  <span>{post.readingMinutes} min read</span>
                </div>
                <h2 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark group-hover:underline underline-offset-4 leading-snug">
                  {post.title}
                </h2>
                <p className="text-[14px] text-muted-light dark:text-muted-dark mt-2 leading-relaxed">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark uppercase tracking-wider"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
