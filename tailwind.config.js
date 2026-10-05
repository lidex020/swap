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
          bg: '#f7f9f8',
          card: '#ffffff',
          card2: '#edf5f0',
          input: '#f5f7f6',
          green: '#13895c',
          lime: '#13895c',
          bright: '#32a875',
          dark: '#0b5c3c',
          border: '#e3e9e5',
          glow: '#13895c'
        },
        pancake: {
          bg: '#f7f9f8',
          card: '#ffffff',
          card2: '#edf5f0',
          input: '#f5f7f6',
          purple: '#13895c',
          cyan: '#32a875',
          pink: '#ed4b9e',
          yellow: '#13895c',
          dark: '#f5f7f6',
          border: '#e3e9e5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        '4xl': '24px'
      }
    },
  },
  plugins: [],
}
