import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import chroma from "chroma-js";
import { useStash } from "../state/StashContext";
import { readableTextOn } from "../lib/color";

type LayoutId = "dashboard" | "hero" | "mobile" | "card" | "magazine";

const LAYOUTS: Array<{ id: LayoutId; label: string; blurb: string }> = [
  { id: "dashboard", label: "Dashboard", blurb: "App UI with sidebar, cards, chart" },
  { id: "hero", label: "Hero", blurb: "Marketing landing-page block" },
  { id: "mobile", label: "Mobile", blurb: "Phone screen with status bar" },
  { id: "card", label: "Business card", blurb: "Tilted brand card" },
  { id: "magazine", label: "Magazine", blurb: "Editorial spread" },
];

interface RolePalette {
  bg: string;
  surface: string;
  accent: string;
  secondary: string;
  ink: string;
  inkMuted: string;
}

function autoAssign(hexes: string[]): RolePalette {
  if (hexes.length === 0) {
    return {
      bg: "#FAF7F2",
      surface: "#FFFFFF",
      accent: "#D4A574",
      secondary: "#7A7468",
      ink: "#1A1A1A",
      inkMuted: "#7A7468",
    };
  }
  const sorted = [...hexes].sort((a, b) => chroma(b).luminance() - chroma(a).luminance());
  const lightest = sorted[0];
  const darkest = sorted[sorted.length - 1];
  // pick most chromatic of remaining for accent
  const middle = sorted.slice(1, -1);
  const byChroma = [...middle].sort((a, b) => (chroma(b).oklch()[1] || 0) - (chroma(a).oklch()[1] || 0));
  const accent = byChroma[0] ?? sorted[Math.floor(sorted.length / 2)];
  const secondary = byChroma[1] ?? sorted[Math.floor(sorted.length / 2)];
  const surface = chroma(lightest).luminance() > 0.6 ? lightest : chroma.mix(lightest, "white", 0.4).hex();
  const bg = chroma(lightest).luminance() > 0.85
    ? lightest
    : chroma(lightest).luminance() > 0.55
      ? chroma.mix(lightest, "white", 0.5).hex()
      : "#FAF7F2";
  const ink = darkest;
  const inkMuted = chroma.mix(darkest, "#999999", 0.4).hex();
  return { bg, surface, accent, secondary, ink, inkMuted };
}

export function VisualizePage() {
  const { stash } = useStash();
  const [layout, setLayout] = useState<LayoutId>("dashboard");
  const [auto, setAuto] = useState<RolePalette | null>(null);
  const [overrides, setOverrides] = useState<Partial<RolePalette>>({});

  const hexes = stash.swatches.map((s) => s.hex);

  useEffect(() => {
    setAuto(autoAssign(hexes));
    setOverrides({});
  }, [hexes.join(",")]);

  const palette: RolePalette = useMemo(() => {
    const base = auto ?? autoAssign(hexes);
    return { ...base, ...overrides };
  }, [auto, overrides, hexes.join(",")]);

  const setRole = (role: keyof RolePalette, hex: string) => {
    setOverrides((p) => ({ ...p, [role]: hex }));
  };

  const reshuffle = () => {
    if (hexes.length === 0) return;
    const shuffled = [...hexes].sort(() => Math.random() - 0.5);
    setAuto(autoAssign(shuffled));
    setOverrides({});
  };

  if (stash.swatches.length === 0) {
    return (
      <div className="canvas-grain h-full flex flex-col items-center justify-center px-4 max-w-[1600px] mx-auto w-full">
        <div className="text-center space-y-3 max-w-md">
          <div className="eyebrow text-muted-light dark:text-muted-dark">visualize</div>
          <h1 className="font-display font-medium text-2xl tracking-tight text-ink-light dark:text-ink-dark display-tight">
            Add colors to your stash first.
          </h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            Once you have a palette, see it applied to dashboards, hero blocks, mobile screens, and more.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link to="/generate" className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90">
              Generate a palette
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">visualize</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            See it on real things.
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-full p-0.5">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`px-3 py-1 text-[12px] font-medium rounded-full transition ${
                  layout === l.id
                    ? "bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark"
                    : "text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            onClick={reshuffle}
            className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
            title="Randomize role assignment"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reshuffle
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[1fr_240px] gap-3">
        <div className="min-w-0 min-h-0 rounded-2xl border border-line-light dark:border-line-dark overflow-hidden shadow-soft">
          {layout === "dashboard" && <DashboardMock p={palette} />}
          {layout === "hero" && <HeroMock p={palette} />}
          {layout === "mobile" && <MobileMock p={palette} />}
          {layout === "card" && <CardMock p={palette} />}
          {layout === "magazine" && <MagazineMock p={palette} />}
        </div>

        <aside className="rounded-2xl border border-line-light dark:border-line-dark p-3 bg-surface-light/50 dark:bg-surface-dark/50 overflow-y-auto scroll-thin">
          <div className="eyebrow text-muted-light dark:text-muted-dark mb-2.5">Roles</div>
          <div className="space-y-2.5">
            {(["bg", "surface", "accent", "secondary", "ink", "inkMuted"] as Array<keyof RolePalette>).map((role) => (
              <div key={role}>
                <div className="text-[10px] uppercase tracking-wider text-muted-light dark:text-muted-dark mb-1">
                  {role}
                </div>
                <div className="flex flex-wrap gap-1">
                  {hexes.map((hex) => (
                    <button
                      key={`${role}-${hex}`}
                      onClick={() => setRole(role, hex)}
                      className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                        palette[role].toUpperCase() === hex.toUpperCase()
                          ? "border-ink-light dark:border-ink-dark"
                          : "border-transparent"
                      }`}
                      style={{ background: hex }}
                      title={hex}
                      aria-label={`Use ${hex} as ${role}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function DashboardMock({ p }: { p: RolePalette }) {
  return (
    <div style={{ background: p.bg, color: p.ink }} className="h-full w-full flex">
      <div style={{ background: p.surface, borderRight: `1px solid ${p.inkMuted}33` }} className="w-44 p-4 flex flex-col gap-3">
        <div style={{ background: p.accent, color: readableTextOn(p.accent) }} className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-tight w-fit">
          ◆ atlas
        </div>
        <nav className="text-[12px] space-y-0.5 mt-2">
          {["Dashboard", "Customers", "Reports", "Settings"].map((t, i) => (
            <div
              key={t}
              className="px-2 py-1.5 rounded"
              style={{
                background: i === 0 ? p.accent + "22" : "transparent",
                color: i === 0 ? p.accent : p.inkMuted,
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              {t}
            </div>
          ))}
        </nav>
        <div className="mt-auto text-[10px]" style={{ color: p.inkMuted }}>v3.21 · build 04.30</div>
      </div>
      <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: p.inkMuted }}>Overview</div>
            <div className="text-2xl font-semibold tracking-tight">Good morning, Mara</div>
          </div>
          <button style={{ background: p.accent, color: readableTextOn(p.accent) }} className="px-3 py-1.5 rounded-md text-[12px] font-semibold">
            + New report
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: "$48.2k", delta: "+12.4%" },
            { label: "New customers", value: "238", delta: "+5.1%" },
            { label: "Churn", value: "2.4%", delta: "−0.3%" },
          ].map((c, i) => (
            <div key={c.label} style={{ background: p.surface, borderColor: p.inkMuted + "22" }} className="rounded-lg p-3 border">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: p.inkMuted }}>{c.label}</div>
              <div className="text-xl font-semibold mt-1 tracking-tight">{c.value}</div>
              <div className="text-[11px] font-medium" style={{ color: i === 2 ? p.secondary : p.accent }}>{c.delta}</div>
            </div>
          ))}
        </div>
        <div style={{ background: p.surface, borderColor: p.inkMuted + "22" }} className="rounded-lg p-4 border flex-1 min-h-0">
          <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: p.inkMuted }}>Last 30 days</div>
          <svg viewBox="0 0 360 80" className="w-full h-32" preserveAspectRatio="none">
            <path d="M0,60 Q30,52 60,40 T120,30 T180,46 T240,28 T300,16 T360,22" stroke={p.accent} strokeWidth="2.5" fill="none" />
            <path d="M0,60 Q30,52 60,40 T120,30 T180,46 T240,28 T300,16 T360,22 L360,80 L0,80 Z" fill={p.accent} fillOpacity="0.18" />
            <path d="M0,68 Q30,72 60,64 T120,58 T180,68 T240,52 T300,44 T360,50" stroke={p.secondary} strokeWidth="2" fill="none" strokeDasharray="3,3" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function HeroMock({ p }: { p: RolePalette }) {
  return (
    <div style={{ background: p.bg, color: p.ink }} className="h-full w-full p-10 flex flex-col">
      <div className="flex items-center justify-between text-[12px] mb-12">
        <div className="font-semibold tracking-tight" style={{ color: p.ink }}>◆ atlas</div>
        <div className="flex gap-5" style={{ color: p.inkMuted }}>
          <span>Product</span><span>Pricing</span><span>Docs</span><span>Sign in</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-between gap-12 min-h-0">
        <div className="max-w-xl">
          <div style={{ background: p.accent + "22", color: p.accent }} className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest">
            New · v3 release
          </div>
          <h2 className="text-5xl font-semibold tracking-tight mt-4 leading-[1.05]">
            The fastest way to ship a brand system that actually feels like yours.
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: p.inkMuted }}>
            Generate, refine, and export design tokens in minutes — without the fragile spreadsheets.
          </p>
          <div className="flex gap-2 mt-6">
            <button style={{ background: p.accent, color: readableTextOn(p.accent) }} className="px-4 py-2.5 rounded-md text-[13px] font-semibold">
              Start free →
            </button>
            <button style={{ borderColor: p.inkMuted + "55", color: p.ink }} className="px-4 py-2.5 rounded-md text-[13px] font-medium border">
              Watch demo
            </button>
          </div>
        </div>
        <div style={{ background: p.surface, borderColor: p.inkMuted + "22" }} className="rounded-2xl p-5 w-72 border shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {[p.accent, p.secondary, p.ink, p.inkMuted, p.bg, p.surface].map((c, i) => (
              <div key={i} className="aspect-square rounded-md" style={{ background: c, border: c === p.bg || c === p.surface ? `1px solid ${p.inkMuted}33` : undefined }} />
            ))}
          </div>
          <div className="text-[11px] mt-3 font-mono" style={{ color: p.inkMuted }}>
            6 tokens · synced live
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMock({ p }: { p: RolePalette }) {
  return (
    <div style={{ background: p.bg }} className="h-full w-full flex items-center justify-center p-6">
      <div style={{ background: p.surface, borderColor: p.inkMuted + "33", color: p.ink }} className="w-72 h-full max-h-[640px] rounded-[36px] border-[6px] shadow-2xl overflow-hidden flex flex-col">
        <div style={{ background: p.surface, color: p.ink }} className="px-5 py-2.5 flex items-center justify-between text-[10px] font-semibold">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <span>●●●</span><span>📶</span><span>🔋</span>
          </div>
        </div>
        <div className="px-5 py-4 flex-1 overflow-hidden">
          <div className="text-[10px] uppercase tracking-wider" style={{ color: p.inkMuted }}>Tuesday</div>
          <div className="text-2xl font-semibold tracking-tight mt-0.5">Today's brief</div>
          <div style={{ background: p.accent, color: readableTextOn(p.accent) }} className="mt-4 rounded-2xl p-4">
            <div className="text-[10px] uppercase tracking-widest opacity-80">Featured</div>
            <div className="text-lg font-semibold tracking-tight mt-1 leading-tight">Three trends shaping color in 2026</div>
            <div className="text-[11px] mt-2 opacity-90">Read · 4 min</div>
          </div>
          <div className="mt-3 space-y-2">
            {["Morning routine", "New saved palette", "Reading list"].map((t, i) => (
              <div key={t} style={{ borderColor: p.inkMuted + "22" }} className="flex items-center gap-3 p-2.5 rounded-lg border">
                <div style={{ background: i === 0 ? p.secondary : p.accent + "33" }} className="w-9 h-9 rounded-md shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold leading-tight">{t}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: p.inkMuted }}>updated {2 - i}h ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: p.surface, borderTop: `1px solid ${p.inkMuted}22` }} className="flex justify-around py-3">
          {["◆", "♡", "◯", "☰"].map((g, i) => (
            <div key={i} className="text-lg" style={{ color: i === 0 ? p.accent : p.inkMuted }}>{g}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardMock({ p }: { p: RolePalette }) {
  return (
    <div style={{ background: p.bg }} className="h-full w-full flex items-center justify-center p-10">
      <div className="relative">
        <div
          style={{ background: p.secondary, transform: "rotate(-7deg) translate(-20px, 12px)" }}
          className="absolute inset-0 rounded-xl shadow-2xl"
        />
        <div
          style={{ background: p.surface, color: p.ink, transform: "rotate(3deg)" }}
          className="relative w-[480px] h-[280px] rounded-xl shadow-2xl p-7 flex flex-col justify-between"
        >
          <div>
            <div style={{ background: p.accent }} className="w-8 h-8 rounded-md" />
            <div className="font-semibold text-2xl tracking-tight mt-3">Mara Hollister</div>
            <div className="text-[12px]" style={{ color: p.inkMuted }}>Brand designer · Atlas Studio</div>
          </div>
          <div className="flex items-end justify-between text-[11px]" style={{ color: p.inkMuted }}>
            <div>
              <div>mara@atlas.studio</div>
              <div>+1 415 555 0142</div>
            </div>
            <div className="font-mono uppercase tracking-widest text-[10px]" style={{ color: p.accent }}>
              atlas.studio
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MagazineMock({ p }: { p: RolePalette }) {
  return (
    <div style={{ background: p.bg, color: p.ink }} className="h-full w-full grid grid-cols-2">
      <div className="p-10 flex flex-col justify-between">
        <div className="text-[10px] uppercase tracking-widest" style={{ color: p.inkMuted }}>
          ISSUE 04 · SPRING
        </div>
        <div>
          <div style={{ color: p.accent }} className="text-[12px] uppercase tracking-widest font-semibold mb-2">
            Field notes
          </div>
          <h2 className="text-5xl font-semibold tracking-tight leading-[0.95]">
            What we keep <em style={{ color: p.accent }} className="not-italic font-display">when we leave.</em>
          </h2>
          <p className="text-sm mt-4 leading-relaxed max-w-md" style={{ color: p.inkMuted }}>
            On the small rituals that travel with us — and the colors that anchor a place we'll never see again. A photo essay from the high coast.
          </p>
          <div className="text-[11px] mt-4" style={{ color: p.inkMuted }}>
            By Eli Kovács · Photography by Maya Linden
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px]" style={{ color: p.inkMuted }}>
          <div>p. 24</div>
          <div>atlas.quarterly</div>
        </div>
      </div>
      <div style={{ background: p.accent }} className="relative overflow-hidden">
        <div style={{ background: p.secondary }} className="absolute top-1/4 -left-12 w-72 h-72 rounded-full opacity-70" />
        <div style={{ background: p.ink }} className="absolute -bottom-16 right-12 w-44 h-44 rounded-full opacity-90" />
        <div className="absolute bottom-6 right-8 text-right" style={{ color: readableTextOn(p.accent) }}>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">Plate 04</div>
          <div className="font-display text-xl font-semibold tracking-tight mt-1">A field, in pieces</div>
        </div>
      </div>
    </div>
  );
}
