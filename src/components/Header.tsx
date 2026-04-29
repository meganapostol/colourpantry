import { NavLink } from "react-router-dom";
import { useTheme } from "../state/ThemeContext";
import chroma from "chroma-js";

const tabs = [
  { to: "/", label: "Home", end: true },
  { to: "/skin", label: "Skin" },
  { to: "/extract", label: "Extract" },
  { to: "/stashes", label: "Stashes" },
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
  const letters = LOGO_TEXT.split("");
  const colored = letters.filter((c) => c !== " ");
  let colorIdx = 0;
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-canvas-light/80 dark:bg-canvas-dark/80 border-b border-line-light/70 dark:border-line-dark/70">
      <div className="flex items-center justify-between px-6 py-3.5 max-w-[1600px] mx-auto">
        <NavLink
          to="/"
          className="font-display font-medium text-[22px] leading-none tracking-tight select-none"
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

        <nav className="flex items-center gap-0.5 bg-surface-light/60 dark:bg-surface-dark/40 border border-line-light/70 dark:border-line-dark/70 rounded-full p-1">
          {tabs.map((t) => (
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
        </nav>

        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full border border-line-light dark:border-line-dark bg-surface-light/60 dark:bg-surface-dark/40 text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
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
