import scrollbarHide from "tailwind-scrollbar-hide";
/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  plugins: [
    scrollbarHide,
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: "#1e40af",       // strong blue (blue-800)
        "primary-soft": "#3b82f6", // lighter blue for glows (blue-500)
        "primary-glow": "#60a5fa", // subtle glow (blue-400)
        accent: "#0f172a",         // dark slate
        "background-dark": "#020617", // background

        // Optional helpers (if you want more shades later)
        // "secondary": "#???",
        // "highlight": "#???",
      },
    },
  },
  darkMode: "class",
}
