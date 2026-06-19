import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15231d",
        moss: "#315846",
        sage: "#7c9a7d",
        mint: "#e9f3ec",
        cloud: "#f7f8f5",
        amber: "#d48a22",
        coral: "#c94e3f",
        steel: "#436275"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 35, 29, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
