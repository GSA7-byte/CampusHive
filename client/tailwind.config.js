/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#2563EB",
        "primary-light": "#DBEAFE",
        "primary-dark": "#1E40AF",
        "surface": "#FFFFFF",
        "surface-secondary": "#F8FAFC",
        "surface-tertiary": "#F1F5F9",
      },
      fontFamily: {
        "display": ["Outfit", "Space Grotesk", "sans-serif"]
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      }
    },
  },
  plugins: [],
}