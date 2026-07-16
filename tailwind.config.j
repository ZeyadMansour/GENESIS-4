/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        genesis: {
          bg: '#0000f2',
          fg: '#f5f5f5',
          paper: '#0a0a8a',
          accent: '#3b3bff',
          muted: 'rgba(245,245,245,0.5)',
          border: 'rgba(245,245,245,0.12)',
          thinking: '#1a1a5e',
          tool: '#0d0d6e',
        },
      },
      fontFamily: {
        mono: ['Courier Prime', 'Courier New', 'monospace'],
        sans: ['Sigurd', 'Times New Roman', 'serif'],
      },
      textTransform: {
        uppercase: 'uppercase',
      },
    },
  },
  plugins: [],
}
