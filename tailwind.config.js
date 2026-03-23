/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#353535',
        teal: '#3c6e71',
        cream: '#d9d9d9',
        navy: '#284b63',
      },
    },
  },
  plugins: [],
}
