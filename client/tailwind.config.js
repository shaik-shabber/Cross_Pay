/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // ✅ include all
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          soft: "#eff6ff",
        },
        page: "#f3f6fb",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        bloom: "0 18px 48px rgba(15, 23, 42, 0.08)",
        soft: "0 10px 28px rgba(37, 99, 235, 0.10)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};