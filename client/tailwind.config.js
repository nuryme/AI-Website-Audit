/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FFC107', dark: '#FFD54F' },
        accent: { DEFAULT: '#E91E63', dark: '#F48FB1' },
        secondary: { DEFAULT: '#7B7C68', dark: '#B0B48C' },
        neutral: '#FDFDFD',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
