/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-navy': '#1e3a8a',
        'brand-blue': '#3b82f6',
        'accent-orange': '#f97316',
      },
    },
  },
  plugins: [],
}
