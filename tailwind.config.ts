import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        obsidian: {
          950: "#06080D",
          900: "#0B0F17",
          800: "#131B2A",
          700: "#1E293B",
          600: "#334155",
        },
        hazard: {
          red: "#EF4444",
          amber: "#F59E0B",
          emerald: "#10B981",
          cyan: "#06B6D4",
        }
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-emerald": "glowEmerald 2s ease-in-out infinite alternate",
        "glow-hazard": "glowHazard 1.5s ease-in-out infinite alternate",
      },
      keyframes: {
        glowEmerald: {
          "0%": { boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)" },
          "100%": { boxShadow: "0 0 35px rgba(16, 185, 129, 0.8)" },
        },
        glowHazard: {
          "0%": { boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)" },
          "100%": { boxShadow: "0 0 35px rgba(239, 68, 68, 0.85)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
