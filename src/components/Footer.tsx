export function Footer() {
  return (
    <footer className="border-t border-line-light dark:border-line-dark mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-light dark:text-muted-dark">
        <div className="flex items-center gap-3">
          <span>colour pantry</span>
          <span aria-hidden>·</span>
          <span>free forever</span>
          <span aria-hidden>·</span>
          <span>no signup, no backend</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/meganapostol/colourpantry"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            github
          </a>
          <span aria-hidden>·</span>
          <span className="font-mono">v1</span>
        </div>
      </div>
    </footer>
  );
}
