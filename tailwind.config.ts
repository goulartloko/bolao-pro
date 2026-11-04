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
        background: "var(--background)",
        foreground: "var(--foreground)",
        arena: {
          950: "#080c0e",
          900: "#0d1418",
          850: "#131c22",
          800: "#1b2730",
          700: "#273846",
          600: "#3d5366",
        },
        pitch: {
          green: "#00E676",
          dark: "#003b1e",
          light: "#69f0ae",
        },
        gold: {
          500: "#FFB800",
          600: "#E5A500",
          400: "#FFCA38",
        },
        pix: {
          DEFAULT: "#32BCAD",
          dark: "#207269",
          light: "#57d4c6",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(0, 230, 118, 0.35)",
        goldglow: "0 0 25px -5px rgba(255, 184, 0, 0.35)",
        pixglow: "0 0 25px -5px rgba(50, 188, 173, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
