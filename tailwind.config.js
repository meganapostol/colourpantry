/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          light: "#FAF7F2",
          dark: "#1A1A1A",
        },
        ink: {
          light: "#2A2A2A",
          dark: "#FAF7F2",
        },
        line: {
          light: "#E5DFD4",
          dark: "#2E2E2E",
        },
        muted: {
          light: "#6B6B6B",
          dark: "#9A9A9A",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
