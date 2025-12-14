/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilitamos modo oscuro manual como en tu versión anterior
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Fuente oficial
      },
      colors: {
        // Paleta oficial CEITM
        guinda: {
            50: '#f9f5f6',
            100: '#f3ebee',
            200: '#e7d6d9',
            300: '#dcc1c6',
            400: '#c59ca4',
            500: '#ae7781',
            600: '#691C28', // Principal
            700: '#531620',
            800: '#3e1118',
            900: '#280c0f'
        },
        "blue-gray": {
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1",
            400: "#94a3b8",
            500: "#64748b",
            600: "#475569",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a"
        }
      }
    },
  },
  plugins: [],
}