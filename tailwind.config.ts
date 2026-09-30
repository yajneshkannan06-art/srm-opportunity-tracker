import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // legacy vars kept for compat
        background: "var(--background)",
        foreground: "var(--foreground)",
        // design system palette
        base:        "#0a0e1a",
        surface:     "#101626",
        surface2:    "#161d33",
        line:        "#232b45",
        ink:         "#e6e9f2",
        muted:       "#8b93ad",
        primary:     "#6366f1",
        primaryHover:"#818cf8",
        accent:      "#22d3ee",
        success:     "#34d399",
        warning:     "#fbbf24",
        danger:      "#fb7185",
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        card:   "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
        glow:   "0 0 24px rgba(99,102,241,0.25)",
        "glow-accent": "0 0 20px rgba(34,211,238,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
