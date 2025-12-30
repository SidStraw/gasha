/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GACHAGO! 色彩系統
        gasha: {
          bg: '#f6f3eb',           // 米白背景
          brown: '#725349',        // 主要棕色 (邊框、文字)
          'brown-dark': '#6f534a', // 深棕色 (文字)
          'brown-light': '#a3948c',// 淺棕色 (次要文字)
          red: '#e05a47',          // 強調紅色 (主按鈕)
          yellow: '#f2c94c',       // 黃色 (設定按鈕)
          blue: '#4d9bea',         // 藍色 (搖動按鈕)
          green: '#5fb376',        // 綠色
          orange: '#eaa14d',       // 橙色
        },
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        display: ['Bungee', 'cursive'],
        body: ['"Noto Sans TC"', 'sans-serif'],
      },
      animation: {
        'sphere-enter': 'sphereEnter 0.5s ease-out forwards',
        'sway': 'sway 2s ease-in-out infinite',
        'spin-slow': 'spin 1s linear infinite',
      },
      keyframes: {
        sphereEnter: {
          '0%': { opacity: '0', transform: 'translateY(-300px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
      },
    },
  },
  plugins: [],
}
