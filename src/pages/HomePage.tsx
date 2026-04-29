import { Link } from "react-router-dom";
import { HUE_FAMILIES } from "../lib/color";
import { readableTextOn } from "../lib/color";

export function HomePage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-light dark:text-ink-dark">
          Every hex code, in cubes.
        </h1>
        <p className="text-muted-light dark:text-muted-dark mt-2 text-sm max-w-2xl">
          Pick a hue family to drill into thousands of clickable, in-gamut shades. Click any swatch to copy the hex and stash it in your bible.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {HUE_FAMILIES.map((f) => (
          <Link
            key={f.id}
            to={`/family/${f.id}`}
            className="group block rounded-md overflow-hidden border border-line-light dark:border-line-dark hover:scale-[1.02] transition-transform"
            style={{ background: f.representativeHex }}
          >
            <div
              className="aspect-square flex items-end p-3"
              style={{ color: readableTextOn(f.representativeHex) }}
            >
              <div>
                <div className="text-base font-medium">{f.name}</div>
                <div className="text-[10px] font-mono opacity-80">
                  {f.representativeHex.toUpperCase()} · {f.centerHue}°
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
