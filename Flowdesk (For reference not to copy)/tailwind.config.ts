import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        subtle: "var(--bg-subtle)",
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
          glow: "var(--accent-glow)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        success: {
          DEFAULT: "var(--success)",
          dim: "var(--success-dim)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          dim: "var(--warning-dim)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          dim: "var(--danger-dim)",
        },
        info: {
          DEFAULT: "var(--info)",
          dim: "var(--info-dim)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;

