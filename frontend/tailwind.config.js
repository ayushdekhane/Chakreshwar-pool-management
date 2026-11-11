/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#087FA5',
          'blue-light': '#0B97C4',
          'blue-dark': '#066382',
          purple: '#70218C',
          'purple-light': '#8D2CB0',
          pink: '#BE2365',
          red: '#E12C3D',
          orange: '#ED6429',
          gold: '#EFB33A',
          bg: '#F4F7F9',
          text: '#171717',
          muted: '#64748B',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 25px -3px rgba(8, 127, 165, 0.08), 0 4px 6px -2px rgba(8, 127, 165, 0.04)',
      },
    },
  },
  plugins: [],
}

