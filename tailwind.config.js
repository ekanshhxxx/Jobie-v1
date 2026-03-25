/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        primaryHover: "#1D4ED8",
        card: "#F8FAFC",
        border: "#E5E7EB",
        mainText: "#111827",
        secondaryText: "#6B7280",
        pending: "#F59E0B",
        accepted: "#10B981",
        rejected: "#EF4444",
      },
    },
  },
  plugins: [],
};