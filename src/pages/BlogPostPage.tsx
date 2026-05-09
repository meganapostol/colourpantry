import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getPostBySlug, getPublishedPosts } from "../lib/blogPosts";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BlogPostPage() {
  const { slug = "" } = useParams();
  const post = getPostBySlug(slug);

  useEffect(() => {
    const previous = document.title;
    if (post) {
      document.title = `${post.title} · Colour Pantry`;
      const meta = document.querySelector('meta[name="description"]');
      const previousDescription = meta?.getAttribute("content") ?? null;
      if (meta) meta.setAttribute("content", post.description);
      return () => {
        document.title = previous;
        if (meta && previousDescription !== null) {
          meta.setAttribute("content", previousDescription);
        }
      };
    }
    return undefined;
  }, [post]);

  if (!post) {
    return (
      <div className="canvas-grain h-full overflow-y-auto scroll-thin">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link
            to="/blog"
            className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            ← all notes
          </Link>
          <h1 className="mt-6 font-display font-medium text-2xl tracking-tight text-ink-light dark:text-ink-dark">
            Post not found.
          </h1>
          <p className="mt-2 text-[14px] text-muted-light dark:text-muted-dark">
            That URL doesn't match any of our notes. Maybe you were looking for one of these:
          </p>
          <ul className="mt-4 space-y-2">
            {getPublishedPosts().map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/blog/${p.slug}`}
                  className="underline hover:opacity-70 text-ink-light dark:text-ink-dark text-[14px]"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const others = getPublishedPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="canvas-grain h-full overflow-y-auto scroll-thin">
      <article className="max-w-2xl mx-auto px-6 py-10">
        <Link
          to="/blog"
          className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
        >
          ← all notes
        </Link>
        <header className="mt-6">
          <div className="flex items-baseline gap-3 text-[11px] font-mono text-muted-light dark:text-muted-dark mb-3">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
          </div>
          <h1 className="font-display font-medium text-3xl tracking-tight text-ink-light dark:text-ink-dark display-tight">
            {post.title}
          </h1>
          <p className="text-[15px] text-muted-light dark:text-muted-dark mt-3 leading-relaxed">
            {post.description}
          </p>
        </header>
        <div className="mt-8 text-[15px] leading-relaxed text-ink-light dark:text-ink-dark">
          {post.body()}
        </div>

        {others.length > 0 && (
          <aside className="mt-12 pt-6 border-t border-line-light dark:border-line-dark">
            <span className="eyebrow text-muted-light dark:text-muted-dark">also in the pantry</span>
            <ul className="mt-3 space-y-3">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link to={`/blog/${p.slug}`} className="group block">
                    <span className="font-display font-medium text-[15px] tracking-tight text-ink-light dark:text-ink-dark group-hover:underline underline-offset-4">
                      {p.title}
                    </span>
                    <span className="block text-[12px] text-muted-light dark:text-muted-dark mt-0.5">
                      {p.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>
    </div>
  );
}
