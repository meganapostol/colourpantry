import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../state/ThemeContext";
import chroma from "chroma-js";

const PRIMARY_TABS = [
  { to: "/", label: "Home", end: true },
  { to: "/generate", label: "Generate" },
  { to: "/library", label: "Library" },
  { to: "/stashes", label: "Stashes" },
];

const TOOL_TABS: Array<{ to: string; label: string; blurb: string }> = [
  { to: "/skin", label: "Skin tones", blurb: "Calibrated tonal rows" },
  { to: "/extract", label: "Extract", blurb: "Pick palette from image" },
  { to: "/collage", label: "Collage", blurb: "Compose images + palette" },
  { to: "/variations", label: "Variations", blurb: "Tints, shades, hues" },
  { to: "/contrast", label: "Contrast", blurb: "WCAG pairwise grid" },
  { to: "/visualize", label: "Visualize", blurb: "Apply to UI mockups" },
  { to: "/gradients", label: "Gradients", blurb: "Compose & save" },
  { to: "/fonts", label: "Fonts", blurb: "Pair the type" },
];

const LOGO_TEXT = "colour pantry";

function logoLetterColor(index: number, total: number, isDark: boolean): string {
  const hue = (index / total) * 360;
  const L = isDark ? 0.78 : 0.62;
  const C = isDark ? 0.18 : 0.16;
  let col = chroma.oklch(L, C, hue);
  if (col.clipped()) {
    let c = C;
    while (c > 0 && col.clipped()) {
      c -= 0.01;
      col = chroma.oklch(L, c, hue);
    }
  }
  return col.hex();
}

export function Header() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const letters = LOGO_TEXT.split("");
  const colored = letters.filter((c) => c !== " ");
  let colorIdx = 0;

  // Close on outside click / escape
  useEffect(() => {
    if (!toolsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [toolsOpen]);

  // Close when navigating
  useEffect(() => {
    setToolsOpen(false);
  }, [location.pathname]);

  const inToolsRoute = TOOL_TABS.some((t) => location.pathname.startsWith(t.to)) ||
    location.pathname.startsWith("/family/");

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-canvas-light/80 dark:bg-canvas-dark/80 border-b border-line-light/70 dark:border-line-dark/70">
      <div className="flex items-center justify-between px-6 py-3.5 max-w-[1600px] mx-auto gap-4">
        <NavLink
          to="/"
          className="font-display font-medium text-[22px] leading-none tracking-tight select-none shrink-0"
          aria-label="Colour Pantry — home"
        >
          {letters.map((ch, i) => {
            if (ch === " ") return <span key={i}>&nbsp;</span>;
            const color = logoLetterColor(colorIdx, colored.length, theme === "dark");
            colorIdx++;
            return (
              <span key={i} style={{ color }} className="transition-colors">
                {ch}
              </span>
            );
          })}
        </NavLink>

        <nav className="flex items-center gap-0.5 bg-surface-light/60 dark:bg-surface-dark/40 border border-line-light/70 dark:border-line-dark/70 rounded-full p-1 relative">
          {PRIMARY_TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-[13px] font-medium tracking-tight transition-all ${
                  isActive
                    ? "bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark shadow-sm"
                    : "text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}

          <div ref={toolsRef} className="relative">
            <button
              onClick={() => setToolsOpen((v) => !v)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium tracking-tight transition-all flex items-center gap-1 ${
                inToolsRoute
                  ? "bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark shadow-sm"
                  : "text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
              }`}
              aria-haspopup="menu"
              aria-expanded={toolsOpen}
            >
              Tools
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${toolsOpen ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {toolsOpen && (
              <div
                role="menu"
                className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-72 rounded-2xl border border-line-light dark:border-line-dark bg-canvas-light dark:bg-canvas-dark shadow-lift overflow-hidden p-1"
              >
                {TOOL_TABS.map((t) => (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    role="menuitem"
                    className={({ isActive }) =>
                      `flex flex-col px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-surface-light dark:bg-surface-dark text-ink-light dark:text-ink-dark"
                          : "hover:bg-surface-light dark:hover:bg-surface-dark text-ink-light dark:text-ink-dark"
                      }`
                    }
                  >
                    <span className="text-[13px] font-medium tracking-tight">{t.label}</span>
                    <span className="text-[11px] text-muted-light dark:text-muted-dark">{t.blurb}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full border border-line-light dark:border-line-dark bg-surface-light/60 dark:bg-surface-dark/40 text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
          aria-label="Toggle theme"
          title={theme === "light" ? "Switch to dark" : "Switch to light"}
        >
          {theme === "light" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
