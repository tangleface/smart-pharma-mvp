import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#06070A",
        card: "#111827",
        panel: "#161B22",
        accent: "#00D1FF",
        text: "#F5F7FA",
        muted: "#9CA3AF",
        warning: "#FF9F43",
        critical: "#FF4D4F",
        success: "#00C48C"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0, 209, 255, 0.16), 0 18px 60px rgba(0, 0, 0, 0.42)"
      }
    }
  },
  plugins: []
};

export default config;

