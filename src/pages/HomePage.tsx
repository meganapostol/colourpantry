import { Link } from "react-router-dom";
import { HUE_FAMILIES, readableTextOn } from "../lib/color";

export function HomePage() {
  return (
    <div className="h-full flex flex-col px-6 pt-4 pb-3 max-w-[1600px] mx-auto w-full canvas-grain">
      <div className="flex items-baseline justify-between pb-3 shrink-0 gap-4 flex-wrap">
        <div>
          <span className="eyebrow text-muted-light dark:text-muted-dark">
            every hex code, in cubes
          </span>
          <h1 className="font-display font-medium text-[22px] tracking-tight text-ink-light dark:text-ink-dark mt-0.5 leading-none">
            Pick a hue family.
          </h1>
        </div>
        <div className="text-[12px] text-muted-light dark:text-muted-dark">
          24 families · 15° each · click any tile to drill in
        </div>
      </div>

      <div className="flex-1 grid grid-cols-6 gap-2 min-h-0">
        {HUE_FAMILIES.map((f) => {
          const ink = readableTextOn(f.representativeHex);
          return (
            <Link
              key={f.id}
              to={`/family/${f.id}`}
              className="group relative block rounded-md overflow-hidden lift-hover h-full w-full"
              style={{ background: f.representativeHex }}
              aria-label={`Open ${f.name} family`}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent 55%, ${ink === "#1A1A1A" ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.18)"} 100%)`,
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 py-2.5 flex items-end justify-between gap-2"
                style={{ color: ink }}
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium tracking-tight leading-none truncate">
                    {f.name}
                  </div>
                  <div className="text-[10px] font-mono opacity-70 mt-1">
                    {f.representativeHex.toUpperCase()}
                  </div>
                </div>
                <div
                  className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    background:
                      ink === "#1A1A1A"
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.2)",
                  }}
                >
                  {f.centerHue}°
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
