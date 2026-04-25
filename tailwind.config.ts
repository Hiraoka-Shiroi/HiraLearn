import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(34, 211, 238, 0.2)",
      },
    },
  },
  plugins: [],
} satisfies Config;
