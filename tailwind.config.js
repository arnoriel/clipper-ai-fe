// /Users/haimac/Project/clipper-ai-fe/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        background: '#FFFFFF',
        text: '#000000',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        syne: ['"Syne"', 'sans-serif'],
        bricolage: ['"Bricolage Grotesque"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}