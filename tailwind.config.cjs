/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#14213D',
        'royal-blue': '#234E91',
        'warm-gold': '#E9B44C',
        'soft-white': '#F8FAFC',
        'light-blue': '#EAF1FA',
        'dark-text': '#1E293B',
        'muted-text': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
