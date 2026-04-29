import { NavLink } from "react-router-dom";
import { useTheme } from "../state/ThemeContext";
import chroma from "chroma-js";

const tabs = [
  { to: "/", label: "Home", end: true },
  { to: "/skin", label: "Skin" },
  { to: "/extract", label: "Extract" },
  { to: "/bibles", label: "Bibles" },
];

const LOGO_TEXT = "COLOUR PANTRY";

function logoLetterColor(index: number, total: number, isDark: boolean): string {
  // Step through hues evenly across the rainbow.
  const hue = (index / total) * 360;
  // Slightly more saturated and brighter on dark, more muted on light.
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
    <header className="border-b border-line-light dark:border-line-dark bg-canvas-light dark:bg-canvas-dark">
      <div className="flex items-center justify-between px-6 py-3">
        <NavLink to="/" className="flex items-center gap-1 font-display text-[15px] tracking-[0.18em] leading-none">
          {letters.map((ch, i) => {
            if (ch === " ") return <span key={i} className="w-2 inline-block" />;
            const color = logoLetterColor(colorIdx, colored.length, theme === "dark");
            colorIdx++;
            return (
              <span
                key={i}
                style={{ color }}
                className="transition-colors"
              >
                {ch}
              </span>
            );
          })}
        </NavLink>

        <nav className="flex items-center gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-white dark:bg-neutral-900 text-ink-light dark:text-ink-dark border border-line-light dark:border-line-dark"
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
          className="w-9 h-9 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-white dark:hover:bg-neutral-900 flex items-center justify-center"
          aria-label="Toggle theme"
          title={theme === "light" ? "Switch to dark" : "Switch to light"}
        >
          {theme === "light" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
