/**
 * SVG color-matrix filters for color-vision-deficiency (CVD) simulation.
 *
 * Matrices are the Brettel/Vienot/Mollon (1997) and Machado (2009) values
 * for severity 1.0 (full deficiency). The "-anomaly" variants are blended
 * 50/50 with identity to approximate partial deficiency.
 *
 * Each <filter> takes sRGB in, multiplies by a 4x5 matrix, returns sRGB out.
 * Apply via CSS: `filter: url(#cvd-deuteranopia)`.
 *
 * The host SVG is sized 0×0 and absolutely positioned so it doesn't take
 * up layout space, but the filter defs remain reachable by URL fragment.
 */
export function CVDFilter() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        {/* Protanopia — red-blind */}
        <filter id="cvd-protanopia">
          <feColorMatrix
            type="matrix"
            values="0.567 0.433 0     0 0
                    0.558 0.442 0     0 0
                    0     0.242 0.758 0 0
                    0     0     0     1 0"
          />
        </filter>

        {/* Protanomaly — red-weak (50/50 blend with identity) */}
        <filter id="cvd-protanomaly">
          <feColorMatrix
            type="matrix"
            values="0.7835 0.2165 0      0 0
                    0.279  0.721  0      0 0
                    0      0.121  0.879  0 0
                    0      0      0      1 0"
          />
        </filter>

        {/* Deuteranopia — green-blind */}
        <filter id="cvd-deuteranopia">
          <feColorMatrix
            type="matrix"
            values="0.625 0.375 0   0 0
                    0.7   0.3   0   0 0
                    0     0.3   0.7 0 0
                    0     0     0   1 0"
          />
        </filter>

        {/* Deuteranomaly — green-weak */}
        <filter id="cvd-deuteranomaly">
          <feColorMatrix
            type="matrix"
            values="0.8125 0.1875 0    0 0
                    0.35   0.65   0    0 0
                    0      0.15   0.85 0 0
                    0      0      0    1 0"
          />
        </filter>

        {/* Tritanopia — blue-blind */}
        <filter id="cvd-tritanopia">
          <feColorMatrix
            type="matrix"
            values="0.95 0.05  0     0 0
                    0    0.433 0.567 0 0
                    0    0.475 0.525 0 0
                    0    0     0     1 0"
          />
        </filter>

        {/* Tritanomaly — blue-weak */}
        <filter id="cvd-tritanomaly">
          <feColorMatrix
            type="matrix"
            values="0.975 0.025  0      0 0
                    0     0.7165 0.2835 0 0
                    0     0.2375 0.7625 0 0
                    0     0      0      1 0"
          />
        </filter>

        {/* Achromatopsia — total color blindness (BT.709 luminance) */}
        <filter id="cvd-achromatopsia">
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0      0      0      1 0"
          />
        </filter>

        {/* Achromatomaly — partial (50/50 with identity) */}
        <filter id="cvd-achromatomaly">
          <feColorMatrix
            type="matrix"
            values="0.6063 0.3576 0.0361 0 0
                    0.1063 0.8576 0.0361 0 0
                    0.1063 0.3576 0.5361 0 0
                    0      0      0      1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
