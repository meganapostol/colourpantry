import { Link } from "react-router-dom";
import { HUE_FAMILIES } from "../lib/color";
import { readableTextOn } from "../lib/color";

export function HomePage() {
  return (
    <div className="canvas-grain">
      <section className="px-6 pt-16 pb-10 max-w-[1400px] mx-auto">
        <div className="max-w-3xl">
          <span className="eyebrow text-muted-light dark:text-muted-dark">
            free · no signup · all client-side
          </span>
          <h1 className="display-tight font-display font-medium mt-4 text-[clamp(2.5rem,6vw,4.75rem)] text-ink-light dark:text-ink-dark">
            Every hex code, in cubes.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-light dark:text-muted-dark max-w-2xl leading-relaxed">
            A color picker that doesn't make you guess. Pick a family below to drill into thousands of clickable, in-gamut shades. Click any swatch to copy the hex and stash it.
          </p>

          <div className="mt-8 flex flex-wrap gap-2 text-[13px] text-muted-light dark:text-muted-dark">
            <Stat n="24" l="hue families" />
            <Stat n="50k+" l="in-gamut shades" />
            <Stat n="9×12" l="skin matrix" />
            <Stat n="0" l="accounts" />
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 max-w-[1400px] mx-auto">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="eyebrow text-muted-light dark:text-muted-dark">
            Hue Families
          </h2>
          <span className="text-[12px] text-muted-light dark:text-muted-dark">
            {HUE_FAMILIES.length} · 15° each
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {HUE_FAMILIES.map((f) => {
            const ink = readableTextOn(f.representativeHex);
            return (
              <Link
                key={f.id}
                to={`/family/${f.id}`}
                className="group relative block aspect-[4/5] rounded-md overflow-hidden lift-hover"
                style={{ background: f.representativeHex }}
                aria-label={`Open ${f.name} family`}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, transparent 50%, ${ink === "#1A1A1A" ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.18)"} 100%)`,
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 p-3.5 flex items-end justify-between"
                  style={{ color: ink }}
                >
                  <div>
                    <div className="text-[15px] font-medium tracking-tight leading-none">
                      {f.name}
                    </div>
                    <div className="text-[10px] font-mono opacity-70 mt-1">
                      {f.representativeHex.toUpperCase()}
                    </div>
                  </div>
                  <div
                    className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        ink === "#1A1A1A" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)",
                    }}
                  >
                    {f.centerHue}°
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-6 pb-20 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Shortcut
            to="/skin"
            eyebrow="9 × 12 matrix"
            title="Skin tones"
            desc="Hand-calibrated undertone rows. Most comprehensive free skin reference online."
            colors={["#FFE5C7", "#E0AC8B", "#A87654", "#5C3317"]}
          />
          <Shortcut
            to="/extract"
            eyebrow="drop in"
            title="From an image"
            desc="Upload a photo, get its dominant palette. Save the lot in one click."
            colors={["#7FB3D5", "#F4D35E", "#EE6C4D", "#293241"]}
          />
          <Shortcut
            to="/stashes"
            eyebrow="folder organized"
            title="Your stashes"
            desc="Save palettes by project. Auto-saves locally. Export PNG, PDF, SVG."
            colors={["#D4A5A5", "#C4B5A0", "#7E9181", "#3E4A4E"]}
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-full bg-surface-light/60 dark:bg-surface-dark/40 border border-line-light dark:border-line-dark">
      <span className="font-display font-medium text-ink-light dark:text-ink-dark">
        {n}
      </span>
      <span>{l}</span>
    </span>
  );
}

function Shortcut({
  to,
  eyebrow,
  title,
  desc,
  colors,
}: {
  to: string;
  eyebrow: string;
  title: string;
  desc: string;
  colors: string[];
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark p-5 lift-hover"
    >
      <div className="flex gap-1 mb-4">
        {colors.map((c) => (
          <div
            key={c}
            className="flex-1 h-10 rounded"
            style={{ background: c }}
          />
        ))}
      </div>
      <span className="eyebrow text-muted-light dark:text-muted-dark">{eyebrow}</span>
      <h3 className="text-xl font-medium tracking-tight text-ink-light dark:text-ink-dark mt-1">
        {title}
      </h3>
      <p className="text-sm text-muted-light dark:text-muted-dark mt-2 leading-relaxed">
        {desc}
      </p>
      <div className="mt-3 text-[13px] text-ink-light dark:text-ink-dark group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
        Open <span aria-hidden>→</span>
      </div>
    </Link>
  );
}
