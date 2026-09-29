/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lidex: {
          bg: '#050a06',
          card: '#111a12',
          card2: '#1a2e1c',
          input: '#162416',
          green: '#22c55e',
          lime: '#84cc16',
          bright: '#4ade80',
          dark: '#052e0a',
          border: '#1f3a22',
          glow: '#22c55e'
        },
        pancake: {
          bg: '#050a06',
          card: '#111a12',
          card2: '#1a2e1c',
          input: '#162416',
          purple: '#22c55e',
          cyan: '#4ade80',
          pink: '#ed4b9e',
          yellow: '#84cc16',
          dark: '#0a1a0c',
          border: '#1f3a22'
        }
      },
      fontFamily: {
        kanit: ['Kanit', 'sans-serif']
      },
      borderRadius: {
        '4xl': '24px'
      }
    },
  },
  plugins: [],
}
