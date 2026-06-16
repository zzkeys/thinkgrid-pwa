/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0A1628',      // 深蓝背景（原设计）
        'dark-card': '#0F1E38',    // 卡片背景（深蓝偏亮）
        'dark-border': '#1E3A5F',  // 边框颜色
        coral: {
          light: '#E8845F',
          DEFAULT: '#D4724A',
          dark: '#C0623A',
        },
        text: {
          primary: '#F5E6C8',     // 米黄文字（原设计）
          secondary: '#8A9BBF',    //  secondary文字（蓝色调）
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
