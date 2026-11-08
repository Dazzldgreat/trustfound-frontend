import scrollbarHide from "tailwind-scrollbar-hide";

/* ============================================================
   TRUSTFOUND PALETTE — Orange & Graphite

   Primary orange   #EA580C
   Graphite         #292524
   Page background  #FFF7ED
   Cards            #FFFFFF
   Text             #44403C

   Every page in the app was written with Tailwind's blue / slate /
   gray utilities. Instead of editing thousands of class names, the
   accent scales (blue, indigo, sky, cyan, violet, purple) are mapped
   to the orange scale and the neutral scales (slate, gray, zinc,
   neutral) are mapped to a warm graphite scale. This keeps the whole
   UI on one consistent palette. Green / red / amber / yellow are left
   untouched so success, error and warning states stay meaningful.
============================================================ */

const orange = {
  50: "#FFF7ED",
  100: "#FFEDD5",
  200: "#FED7AA",
  300: "#FDBA74",
  400: "#FB923C",
  500: "#F97316",
  600: "#EA580C",
  700: "#C2410C",
  800: "#9A3412",
  900: "#7C2D12",
  950: "#431407",
};

const graphite = {
  50: "#FFF7ED",
  100: "#F6EFE7",
  200: "#E9E1D8",
  300: "#D6CEC6",
  400: "#A8A29E",
  500: "#78716C",
  600: "#57534E",
  700: "#44403C",
  800: "#292524",
  900: "#1C1917",
  950: "#0C0A09",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  plugins: [scrollbarHide],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand tokens
        primary: "#EA580C",
        "primary-dark": "#C2410C",
        "primary-soft": "#FB923C",
        "primary-glow": "#FDBA74",
        accent: "#292524",
        graphite: "#292524",
        cream: "#FFF7ED",
        ink: "#44403C",
        "background-dark": "#1C1917",

        // Accent scales → orange
        orange,
        blue: orange,
        indigo: orange,
        sky: orange,
        cyan: orange,
        violet: orange,
        purple: orange,

        // Neutral scales → warm graphite
        stone: graphite,
        slate: graphite,
        gray: graphite,
        zinc: graphite,
        neutral: graphite,
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};
