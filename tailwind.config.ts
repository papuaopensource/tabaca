import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./**/*.tsx"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif"
        ],
        display: ["Playfair Display", "ui-serif", "Georgia", "serif"]
      },
      colors: {
        terra: {
          50:  "#FEF3EE",
          100: "#FCDFC8",
          200: "#F8BF96",
          300: "#F2965B",
          400: "#E97030",
          500: "#C84B1E",
          600: "#A83815",
          700: "#86280E",
          800: "#6A1D0A",
          900: "#541707"
        },
        ink: {
          50:  "#F7F6F5",
          100: "#ECEAE8",
          200: "#D4D0CC",
          300: "#B5B0AA",
          400: "#918C86",
          500: "#706B65",
          600: "#56524D",
          700: "#3D3A38",
          800: "#282523",
          900: "#171513"
        },
        cream: {
          50:  "#FDFCFA",
          100: "#F9F6F1",
          200: "#F2ECE3",
          300: "#E8DDD0",
          400: "#D9CABB"
        }
      }
    }
  },
  plugins: []
}

export default config
