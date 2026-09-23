/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#2563eb',
        'brand-green-hover': '#1d4ed8',
        'brand': '#2563eb',
        'brand-hover': '#1d4ed8',
        'brand-light': '#eff6ff',
        'brand-navy': '#1e3a8a',
        'brand-blue': '#3b82f6',
        'accent-orange': '#f97316',
        'naver-bg': '#f5f6f7',
      },
      animation: {
        'header-shift': 'headerShift 10s ease-in-out infinite',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        headerShift: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
