import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingMinutes: number;
  tags: string[];
  body: () => ReactNode;
}

const Para = ({ children }: { children: ReactNode }) => (
  <p className="mb-4">{children}</p>
);

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="font-display font-medium text-2xl tracking-tight mt-8 mb-3 text-ink-light dark:text-ink-dark">
    {children}
  </h2>
);

const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>
);

const Code = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-[0.9em] px-1 py-0.5 rounded bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark">
    {children}
  </code>
);

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "oklch-explained",
    title: "OKLCH explained: why your palettes look better in a perceptual colour space",
    description:
      "HSL is intuitive but lies about brightness. OKLCH is the perceptual colour space modern colour tools (including Colour Pantry) use under the hood — here's why it matters for designers.",
    publishedAt: "2026-05-08",
    readingMinutes: 4,
    tags: ["colour theory", "oklch", "design"],
    body: () => (
      <>
        <Para>
          If you've ever picked a row of HSL colours at the same lightness and noticed the
          yellow looks searingly bright while the blue feels almost black, you've run into the
          fundamental problem with HSL: it's not <em>perceptually uniform</em>. The L in HSL is a
          mathematical convenience, not a measurement of how bright the colour actually feels.
        </Para>
        <Para>
          OKLCH solves this. It's a perceptual colour space — designed so that equal numerical
          differences correspond to equal perceived differences. A row of swatches at L=70% in
          OKLCH will all <em>look</em> equally bright, regardless of hue. That's the whole pitch.
        </Para>
        <H2>The three axes</H2>
        <UL>
          <li>
            <strong>L</strong> (lightness, 0–1) — how bright the colour feels. 0 is black, 1 is
            white. <Code>L = 0.5</Code> is a mid-tone you can rely on across hues.
          </li>
          <li>
            <strong>C</strong> (chroma, 0–~0.4) — how saturated the colour is. 0 is grey,
            higher values approach the gamut limit. Unlike HSL's "saturation," chroma scales with
            the colour space, so a chroma of 0.15 means the same vibrancy whether you're at red,
            green, or blue.
          </li>
          <li>
            <strong>H</strong> (hue, 0–360°) — the angle around the colour wheel. Same as HSL's
            hue conceptually, but the spacing is perceptually corrected.
          </li>
        </UL>
        <H2>Why it matters for palettes</H2>
        <Para>
          When you build a palette in OKLCH and step through lightness, the entire palette feels
          coherent — you don't get the "yellow looks washed out, navy looks crushed" problem that
          plagues HSL ramps. When you generate harmonies (analogous, complementary, triadic) by
          rotating the hue, the resulting colours feel like genuine siblings rather than random
          neighbours.
        </Para>
        <Para>
          This is why Colour Pantry's family pages are laid out as a 2D grid of lightness ×
          chroma at a fixed hue: the grid is honest. Cells at the same row really do have the
          same perceived brightness. Cells at the same column really do have the same vibrancy.
          Out-of-gamut combinations (which can't be displayed in sRGB) show as gaps — that
          honesty is part of what makes the cutoff shape look organic.
        </Para>
        <H2>When to still reach for HSL</H2>
        <Para>
          HSL isn't useless — it's still the easiest format to type by hand, and CSS supports it
          everywhere. If you're nudging a single colour by eye, HSL is fine. But for systematic
          palette work — scales, ramps, dark-mode pairs, accessibility-driven contrast steps —
          OKLCH gives you results you can actually trust.
        </Para>
        <Para>
          <Link to="/" className="underline hover:opacity-70">
            Browse the hue families →
          </Link>
        </Para>
      </>
    ),
  },
  {
    slug: "designing-for-colour-vision-deficiency",
    title: "Designing for colour vision deficiency: a designer's checklist",
    description:
      "Roughly 1 in 12 men and 1 in 200 women see colour differently. Here's a practical checklist for making sure your palette still communicates when it lands on their screens.",
    publishedAt: "2026-05-09",
    readingMinutes: 5,
    tags: ["accessibility", "a11y", "colour vision"],
    body: () => (
      <>
        <Para>
          Colour vision deficiency (CVD) — the catch-all term for what gets called
          "colour-blindness" — affects about 8% of men and 0.5% of women globally. Most CVD
          users don't see in greyscale; they see colour, but with reduced sensitivity in certain
          parts of the spectrum. The most common forms (deuteranomaly and protanomaly) compress
          reds and greens together. Tritan deficiency, which affects blues and yellows, is much
          rarer.
        </Para>
        <Para>
          When you design something where <em>the colour is the meaning</em> — a red error
          state, a green success badge, a chart with five colour-coded series — you're making
          assumptions about what the user can see. CVD users won't be lost, but they'll be
          working harder than they should.
        </Para>
        <H2>Six things to check before you ship</H2>
        <UL>
          <li>
            <strong>Never make colour the only signal.</strong> A red error should also have an
            icon, a label, or a position. A green check is a check before it is green.
          </li>
          <li>
            <strong>Test in deuteranopia mode.</strong> It's the most common form of CVD by a
            wide margin. If the design works in deutan, it works for the largest cohort.
          </li>
          <li>
            <strong>Mind the 3:1 contrast minimum for graphics.</strong> WCAG 2.1 requires 3:1
            contrast between adjacent meaningful colours (charts, icons). Don't rely on a 2:1
            difference.
          </li>
          <li>
            <strong>Avoid red/green pairs as the only differentiator.</strong> The classic
            pitfall. If you must use them, vary lightness too: a dark red against a light green
            stays distinguishable.
          </li>
          <li>
            <strong>For charts, use shape and pattern alongside colour.</strong> Solid vs dashed
            lines, different markers, hatching. Many chart libraries support this out of the
            box; turn it on.
          </li>
          <li>
            <strong>Run your palette through a CVD simulator.</strong> Don't guess. The brain is
            very good at filling in colour you "remember" — a simulator strips that away.
          </li>
        </UL>
        <H2>How to test in Colour Pantry</H2>
        <Para>
          The A11y dropdown in the top-right of the app applies a colour-vision-deficiency
          simulation to the entire page. Switch it to deuteranopia and walk through your stash.
          Anything that suddenly looks similar to its neighbour is a candidate for adjustment —
          either pull the lightness apart or add a non-colour signal.
        </Para>
        <Para>
          The <Link to="/lookup" className="underline hover:opacity-70">Taste page</Link> shows a
          single hex through every CVD form side-by-side, which is useful when you're picking a
          critical brand colour and want to confirm it stays distinct from the neighbours you're
          planning to pair it with.
        </Para>
        <H2>The deeper point</H2>
        <Para>
          Designing for CVD is not a separate accessibility checklist. It's just a forcing
          function for designing with redundancy — making sure meaning is communicated through
          more than one channel. That redundancy helps CVD users, but it also helps anyone
          glancing at a low-contrast monitor in bright sunlight, or skimming the screen at
          arm's length, or reading a printout.
        </Para>
      </>
    ),
  },
  {
    slug: "extract-brand-palette-from-photo",
    title: "How to extract a brand palette from a single reference photo",
    description:
      "Why moodboard photos work better than colour pickers for finding a brand palette, plus a practical workflow for turning one photo into a five-colour system.",
    publishedAt: "2026-05-09",
    readingMinutes: 4,
    tags: ["branding", "palettes", "workflow"],
    body: () => (
      <>
        <Para>
          A surprising number of brand palettes start with a single photograph — a sunset, a
          piece of pottery, a textile, a film still. There's a reason for that. Photographs
          contain colours that already work together: real light, real shadow, real chromatic
          adaptation. A palette extracted from a photo inherits that natural cohesion.
        </Para>
        <Para>
          Compare that to building a palette from scratch with a colour picker. Even with good
          tooling, you're guessing about how five hand-picked colours will feel when adjacent.
          Photographs do the homework for you.
        </Para>
        <H2>What makes a good source photo</H2>
        <UL>
          <li>
            <strong>One light source.</strong> Mixed lighting (window light + tungsten lamp) gives
            you a palette that fights itself. Pick a photo with a single dominant light.
          </li>
          <li>
            <strong>A clear range.</strong> The photo should have at least one near-black, one
            near-white, and a mid-tone. Without that range, the extracted palette will all live
            in one tonal band and feel flat.
          </li>
          <li>
            <strong>One or two saturated accents.</strong> A bowl of clay, a stripe of fabric,
            the painted door. The accent gives the palette its character.
          </li>
          <li>
            <strong>Avoid stock-photo polish.</strong> Heavily-graded images already have a
            palette imposed on them. Raw or lightly-edited photos give you more room to make the
            palette your own.
          </li>
        </UL>
        <H2>A workflow that actually works</H2>
        <Para>
          The fastest path: drop the photo into the{" "}
          <Link to="/extract" className="underline hover:opacity-70">Pluck</Link> tool, get the
          auto-extracted top 5–8 colours, and use that as a starting point. Don't ship it as-is —
          treat it as a draft. Then:
        </Para>
        <UL>
          <li>
            <strong>Cull duplicates.</strong> Auto-extraction often gives you two near-identical
            mid-tones. Keep one.
          </li>
          <li>
            <strong>Push the extremes.</strong> The darkest and lightest colours from a photo are
            usually too close to grey. Push the dark a little richer (add chroma) and the light a
            little warmer (or cooler, depending on mood).
          </li>
          <li>
            <strong>Test the contrast pairs.</strong> Run the candidate palette through the{" "}
            <Link to="/contrast" className="underline hover:opacity-70">Pair</Link> tool. You
            need at least one combination that hits WCAG AA on body text. If nothing does, your
            palette is too low-contrast for UI work.
          </li>
          <li>
            <strong>Sanity-check accessibility.</strong> Switch the A11y mode to deuteranopia and
            re-check that your accent still reads distinctly against the background.
          </li>
        </UL>
        <H2>The five-colour shape</H2>
        <Para>
          A working brand palette usually has: a near-black, a near-white, a primary (the most
          saturated colour, used sparingly), a secondary (less saturated, used for surfaces and
          large fills), and a neutral mid-tone for borders and muted text. If your extracted
          palette doesn't fit that shape, it's a moodboard, not a system. That's fine — but the
          step from moodboard to system is where you'll do real work.
        </Para>
      </>
    ),
  },
  {
    slug: "seasonal-colour-palettes",
    title: "Building a seasonal colour wardrobe: spring, summer, autumn, winter",
    description:
      "Seasonal palettes aren't just a fashion trick. They're a useful constraint for designers — here's how to think about them and how to build one from a single anchor colour.",
    publishedAt: "2026-05-10",
    readingMinutes: 4,
    tags: ["palettes", "seasons", "branding"],
    body: () => (
      <>
        <Para>
          The "seasonal palette" framework comes from colour analysis in fashion, but it's
          quietly useful for any designer. Each season corresponds to a coherent set of
          properties — lightness range, chroma, undertone — that hold a palette together.
        </Para>
        <H2>The four seasons, briefly</H2>
        <UL>
          <li>
            <strong>Spring.</strong> Warm, light, clear. High lightness, mid chroma, yellow
            undertones. Think peach, coral, leaf-green, sky-blue.
          </li>
          <li>
            <strong>Summer.</strong> Cool, light, muted. High lightness, low chroma, blue
            undertones. Think powder blue, dusty rose, sage, lavender.
          </li>
          <li>
            <strong>Autumn.</strong> Warm, deep, muted. Mid-to-low lightness, mid chroma, golden
            undertones. Think rust, olive, mustard, terracotta.
          </li>
          <li>
            <strong>Winter.</strong> Cool, deep, clear. Low or extreme lightness, high contrast,
            blue undertones. Think jet black, icy white, navy, true red, emerald.
          </li>
        </UL>
        <H2>Why it's useful for designers</H2>
        <Para>
          Most designers don't sit down to design a "spring brand," but season-as-constraint is
          a powerful tool when you're trying to communicate a specific mood. A children's
          education product probably wants to live in spring. A high-end whisky brand probably
          wants autumn or winter. A skincare brand built around lightness and gentleness is
          almost always summer.
        </Para>
        <Para>
          The discipline of "every colour in this palette has to feel like the same season"
          forces a level of coherence that's hard to achieve by eye alone.
        </Para>
        <H2>Building a season around an anchor</H2>
        <Para>
          The fastest way to build a seasonal palette: pick the one colour you absolutely need
          (the brand's signature), and find the season it belongs to. Then add four supporting
          colours that share its season's properties.
        </Para>
        <Para>
          The{" "}
          <Link to="/lookup" className="underline hover:opacity-70">Taste page's</Link> seasonal
          matches feature does this for you. Drop in your anchor hex and it shows the curated
          palettes in each season that contain a colour close to yours, ranked by perceptual
          distance (ΔE). The closest match in each palette is highlighted — that's the colour in
          the existing palette that feels most like your anchor, so you can see what it would
          look like surrounded by the rest of the season's vocabulary.
        </Para>
        <Para>
          Treat the suggestions as a starting point, not a finished palette. Pull the matches
          into a stash, swap out the colours that fight your anchor, and you have a five-colour
          system that holds together.
        </Para>
      </>
    ),
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
