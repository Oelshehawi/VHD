import { type Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./_components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkGreen: "#003e29",
        borderGreen: "#467061",
        darkWhite: "#d9d9d9",
        darkGray: "#222a27",
        lightGray: "#dde2e0",
        darkBlue: "#0a003e",
      },
      boxShadow: {
        custom: "0 1px 1px 0 rgba(65,69,73,.3), 0 1px 3px 1px rgba(65,69,73,.15)",
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
