/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0F0F0F',       // 深灰背景（原始设计）
        'dark-card': '#1A1A1A',     // 卡片背景（稍亮灰）
        'dark-border': '#2A2A2A',   // 边框颜色
        coral: {
          light: '#E8845F',
          DEFAULT: '#D4724A',
          dark: '#C0623A',
        },
        text: {
          primary: '#FFFFFF',      // 白色文字（原始设计）
          secondary: '#9CA3AF',    // 灰色副文字
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
