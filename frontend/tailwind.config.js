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
    },
  },
  plugins: [],
};
