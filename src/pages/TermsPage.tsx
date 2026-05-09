import { Link } from "react-router-dom";

export function TermsPage() {
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
          <span className="eyebrow text-muted-light dark:text-muted-dark">terms</span>
          <h1 className="font-display font-medium text-3xl tracking-tight text-ink-light dark:text-ink-dark display-tight mt-1">
            Terms of use.
          </h1>
          <p className="text-[12px] text-muted-light dark:text-muted-dark mt-2 font-mono">
            Last updated 10 May 2026
          </p>
        </div>

        <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-ink-light dark:text-ink-dark">
          <p>
            Colour Pantry is a free, in-browser tool for picking, organising, and exporting
            colour palettes. By using the site you agree to these terms. They are short on
            purpose.
          </p>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">Use as-is</h2>
            <p>
              The site is provided as-is, without warranty of any kind. You are free to use any
              colour, palette, gradient, or export the tool produces in personal or commercial
              work, including client projects, branding, products, and merchandise. Attribution is
              appreciated but not required.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              What you put in
            </h2>
            <p>
              Anything you upload to the site (reference photos, logos) is processed entirely in
              your browser. We never receive or store it. Don't upload material you don't have
              the right to use.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              Acceptable use
            </h2>
            <p>
              Don't try to abuse the hosting (excessive automated requests, attempting to break
              the site for other users, scraping in a way that harms availability, etc.). Don't
              use the site to host or distribute content that is illegal where you live or where
              the service is hosted.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              No liability
            </h2>
            <p>
              We make no guarantee that the site will be available, accurate, or fit for any
              particular purpose. To the maximum extent allowed by law, the maintainers are not
              liable for any direct or indirect damages resulting from use of the site, including
              loss of work that was only stored locally in your browser. Back up anything you
              can't afford to lose.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              Pro features
            </h2>
            <p>
              Some features (advanced exports, branded PDFs, etc.) may move behind a paid plan in
              the future. If that happens, anything you've already saved locally remains yours,
              and existing free features remain free unless explicitly stated otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">Changes</h2>
            <p>
              These terms may change. The "last updated" date at the top will reflect any
              substantive change. Continued use of the site after a change means you accept the
              updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">Contact</h2>
            <p>
              Questions can go to{" "}
              <a href="mailto:hello@colourpantry.com" className="underline hover:opacity-70">
                hello@colourpantry.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
