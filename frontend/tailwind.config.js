/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#ffffff",
          dark: "#0f172a",
        },
        sidebar: {
          DEFAULT: "#f8fafc",
          dark: "#1e293b",
        },
        muted: {
          DEFAULT: "#64748b",
          dark: "#94a3b8",
        },
      },
      width: {
        drawer: "16rem",
      },
      gridTemplateColumns: {
        layout: "16rem 1fr",
      },
      keyframes: {
        dropdown: {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        toast: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        dropdown: "dropdown 0.15s ease-out",
        toast: "toast 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
