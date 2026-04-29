export function Footer() {
  return (
    <footer className="border-t border-line-light dark:border-line-dark shrink-0">
      <div className="max-w-[1600px] mx-auto px-6 py-1.5 flex items-center justify-between gap-3 text-[11px] text-muted-light dark:text-muted-dark">
        <span>colour pantry · free forever · no signup, no backend</span>
        <div className="flex items-center gap-2">
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
