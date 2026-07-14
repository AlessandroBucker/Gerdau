import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8ff",
          100: "#dbeefe",
          500: "#1683d8",
          600: "#0869b7",
          700: "#075492",
          950: "#092f4f"
        }
      },
      boxShadow: {
        card: "0 20px 60px -24px rgba(15, 42, 67, 0.28)"
      }
    },
  },
  plugins: [],
} satisfies Config;
