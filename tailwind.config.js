/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          1: '#161b22',
          2: '#1c2230',
          3: '#232d3f',
        },
        accent: {
          DEFAULT: '#3b82f6',
          dim: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
