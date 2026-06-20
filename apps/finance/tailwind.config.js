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
                // 블루 테마 통일: 토큰명은 호환을 위해 유지하고 값만 블루로 변경 (main-portal과 동일)
                'brand-green': '#2563eb',
                'brand-green-hover': '#1d4ed8',
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
