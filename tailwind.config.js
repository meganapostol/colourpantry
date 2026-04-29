/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          light: "#FAF7F2",
          dark: "#0E0E0E",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#161616",
        },
        ink: {
          light: "#1A1A1A",
          dark: "#FAF7F2",
        },
        line: {
          light: "#E8E2D5",
          dark: "#262626",
        },
        muted: {
          light: "#7A7468",
          dark: "#9A9A9A",
        },
        accent: {
          light: "#1A1A1A",
          dark: "#FAF7F2",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        sans: ["Jost", "Avant Garde", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Jost", "Avant Garde", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.03em",
        tight: "-0.015em",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20, 14, 0, 0.04), 0 4px 12px rgba(20, 14, 0, 0.04)",
        lift: "0 4px 16px rgba(20, 14, 0, 0.08), 0 8px 32px rgba(20, 14, 0, 0.06)",
        ring: "0 0 0 1px rgba(20, 14, 0, 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
