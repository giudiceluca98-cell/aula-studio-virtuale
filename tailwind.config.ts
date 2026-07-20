import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        paper: "#f7f6f1",
        moss: {
          50: "#f3f7f2",
          100: "#e4eee1",
          200: "#c9ddc5",
          300: "#a4c39d",
          400: "#7ca575",
          500: "#5f8959",
          600: "#496d45",
          700: "#3b5739",
          800: "#314630",
          900: "#2a3b29"
        },
        apricot: "#f1a66a",
        sky: "#8db8c7"
      },
      boxShadow: {
        soft: "0 16px 50px rgba(41, 57, 47, 0.08)",
        card: "0 1px 0 rgba(23,32,27,.05), 0 8px 30px rgba(23,32,27,.05)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    },
  },
  plugins: [forms],
} satisfies Config;
