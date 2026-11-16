import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--bg) / <alpha-value>)",
        foreground: "rgb(var(--fg) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          hover: "rgb(var(--card-hover) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          soft: "rgb(var(--border-soft) / <alpha-value>)",
        },
        surface: {
          1: "rgb(var(--surface-1) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          glass: "rgb(var(--surface-glass) / <alpha-value>)",
        },
        accent: {
          primary: "var(--accent-primary)",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px var(--glow-primary)',
        'glow-success': '0 0 20px var(--glow-success)',
        'glow-warning': '0 0 20px var(--glow-warning)',
        'glow-danger': '0 0 20px var(--glow-danger)',
        'glow-primary-lg': '0 0 40px var(--glow-primary)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-y': 'float-y 3.2s ease-in-out infinite',
        'flame': 'flame-flicker 1.6s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
        'spin-reverse': 'spin-reverse 22s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        'orb-drift': 'orb-drift 14s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.8s ease-in-out infinite',
        'page-flip': 'page-flip 4s ease-in-out infinite',
        'trophy-bounce': 'trophy-bounce 2.6s ease-in-out infinite',
        'bar-shine': 'bar-shine 2.2s ease-in-out infinite',
        'avatar-skeleton': 'avatar-skeleton 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
