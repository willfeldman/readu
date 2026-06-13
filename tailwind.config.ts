import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7EF",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#211B33",
          soft: "#6B6480",
          faint: "#9A92AC",
        },
        primary: {
          DEFAULT: "#6C4AE2",
          50: "#F4F0FE",
          100: "#E8E0FE",
          200: "#D2C1FB",
          300: "#B596F6",
          400: "#916BEE",
          500: "#6C4AE2",
          600: "#5836C9",
          700: "#46299E",
          soft: "#EDE7FE",
          dark: "#3B2486",
        },
        accent: { DEFAULT: "#FF6B5E", soft: "#FFE6E2", dark: "#E2412F" },
        gold: { DEFAULT: "#FFB23E", soft: "#FFF1D6", dark: "#E0890C" },
        mint: { DEFAULT: "#12B488", soft: "#D6F4EB", dark: "#0A8A66" },
        berry: { DEFAULT: "#EE4A6B", soft: "#FCDEE5", dark: "#C82B4C" },
        sky: { DEFAULT: "#2FA9E0", soft: "#DBF0FB", dark: "#1981B4" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        card: "1.75rem",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(33,27,51,0.08), 0 8px 30px -8px rgba(33,27,51,0.10)",
        lift: "0 8px 24px -6px rgba(33,27,51,0.14), 0 24px 60px -20px rgba(76,46,200,0.20)",
        glow: "0 10px 40px -8px rgba(108,74,226,0.45)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.6)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pop: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        rise: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pop: "pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        rise: "rise 0.5s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
        "spin-slow": "spin-slow 14s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
