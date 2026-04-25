import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#020617", // Slate 950
        foreground: "#f8fafc", // Slate 50
        card: "#0f172a", // Slate 900
        accent: {
          primary: "var(--accent-primary)", // Dynamic via CSS variable
          success: "#10b981", // Emerald 500
          warning: "#f59e0b", // Amber 500
          danger: "#ef4444", // Red 500
        },
        muted: "#64748b", // Slate 500
        border: "#1e293b", // Slate 800
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
