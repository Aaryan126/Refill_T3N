import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        moss: "#0369a1",
        sage: "#64748b",
        mint: "#e0f2fe",
        cloud: "#f8fafc",
        amber: "#d48a22",
        coral: "#c94e3f",
        steel: "#436275"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
