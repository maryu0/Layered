
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151b23',
          900: '#11161d',
          950: '#0F1419', // Linear-like dark background
        },
        gray: {
          850: '#1f2937',
        }
      },
      transitionDuration: {
        '180': '180ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
