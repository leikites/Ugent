import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface-2) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accent2: 'rgb(var(--accent-2) / <alpha-value>)',
        positive: 'rgb(var(--positive) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)'
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)']
      },
      boxShadow: {
        soft: '0 1px 0 rgb(0 0 0 / 0.02), 0 10px 18px rgb(0 0 0 / 0.06)',
        inset: 'inset 0 0 0 1px rgb(var(--border) / 1)'
      },
      borderRadius: {
        px: '6px'
      }
    }
  },
  plugins: []
}

export default config
