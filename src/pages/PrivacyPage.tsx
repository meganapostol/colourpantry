import { Link } from "react-router-dom";

export function PrivacyPage() {
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
          <span className="eyebrow text-muted-light dark:text-muted-dark">privacy</span>
          <h1 className="font-display font-medium text-3xl tracking-tight text-ink-light dark:text-ink-dark display-tight mt-1">
            Privacy policy.
          </h1>
          <p className="text-[12px] text-muted-light dark:text-muted-dark mt-2 font-mono">
            Last updated 10 May 2026
          </p>
        </div>

        <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-ink-light dark:text-ink-dark">
          <p>
            Colour Pantry is a free, no-account web tool. This page explains what data the site
            handles, where it lives, and what we do (and don't) do with it. The short version: the
            site doesn't have a backend or a database. Your work stays on your device.
          </p>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              Data stored on your device
            </h2>
            <p>
              Your stashes, palettes, custom logo, theme preference, and accessibility settings are
              stored locally in your browser's IndexedDB and localStorage. They never leave your
              device. Clearing your browser storage will erase them — they aren't backed up
              anywhere on our end because there is no "our end."
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              Data we collect on a server
            </h2>
            <p>
              None directly. We do not run our own backend, analytics, or tracking scripts. The
              static site is served by Vercel, and Vercel collects standard server logs (IP
              address, user agent, request path, timing) for every request as part of operating
              their CDN. Their handling of those logs is covered by{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="underline hover:opacity-70"
              >
                Vercel's privacy policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              Third-party assets
            </h2>
            <p>
              The site loads the Jost typeface from Google Fonts. Google may log the request as
              described in their{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline hover:opacity-70"
              >
                privacy policy
              </a>
              . Aside from that, no other third-party scripts run on the site.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">
              Contact form
            </h2>
            <p>
              If you fill out the contact form, your message and email address are passed
              through a transactional email service (Resend) and forwarded to a private
              inbox. The site does not store your message anywhere; only the operator's
              inbox keeps a copy. Email addresses are used solely to reply.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">Cookies</h2>
            <p>
              The site does not set any cookies. Theme and accessibility preferences are stored in
              localStorage, which is similar to a cookie in that it persists locally, but it is
              not transmitted with network requests.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">Children</h2>
            <p>
              Colour Pantry is a general-audience design tool and is safe for users of any age,
              but it is not specifically designed for or directed at children under 13.
            </p>
          </section>

          <section>
            <h2 className="font-display font-medium text-xl tracking-tight mb-2">Changes</h2>
            <p>
              If we add analytics, error tracking, or any other data-handling behaviour, this page
              will be updated and the "last updated" date at the top will change. The git history
              of the site is public.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
