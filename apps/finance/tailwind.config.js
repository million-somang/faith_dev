/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-green': '#03c75a',
                'brand-green-hover': '#02b350',
                'brand-navy': '#1e3a8a',
                'brand-blue': '#3b82f6',
                'accent-orange': '#f97316',
                'naver-bg': '#f5f6f7',
            },
            animation: {
                'pulse-slow': 'pulse 2s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
