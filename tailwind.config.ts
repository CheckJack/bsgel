import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // BIO Sculpture Brand Colors
        brand: {
          white: "#FFFFFF",
          black: "#000000",
          champagne: "#857D71", // Pantone 8003c
          "champagne-dark": "#5D5850", // Darker shade of champagne
          "sweet-bianca": "#EED9DE", // Pantone 705c
        },
        pink: {
          300: "#F9A8D4",
          500: "#EC4899",
          600: "#DB2777",
          800: "#9D174D",
          900: "#6B1839",
        },
      },
      fontFamily: {
        sans: ["var(--font-jost)", "Tahoma", "Calibri", "Arial", "sans-serif"],
        heading: ["var(--font-jost)", "Tahoma", "Calibri", "Arial", "sans-serif"],
        header: ["var(--font-header)"],
        display: ["var(--font-feature-display-italic)"],
        futura: ["Futura", "Futura-Medium", "Futura Md BT", "var(--font-jost)", "Tahoma", "Calibri", "Arial", "sans-serif"],
      },
      keyframes: {
        scalePulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ellipsis: {
          "0%, 20%": { opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        progress: {
          "0%": { width: "0%", transform: "translateX(0)" },
          "50%": { width: "70%", transform: "translateX(0)" },
          "100%": { width: "100%", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)", opacity: "0.2" },
          "50%": { transform: "translateY(-30px) translateX(10px)", opacity: "0.4" },
        },
        fall: {
          "0%": { transform: "translateX(-50%) translateY(-100px) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateX(-50%) translateY(calc(100vh + 100px)) rotate(360deg)", opacity: "0" },
        },
        marqueeScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        scalePulse: "scalePulse 2s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.8s ease-out",
        ellipsis: "ellipsis 1.4s infinite",
        progress: "progress 1.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        fall: "fall 3s linear infinite",
        marqueeScroll: "marqueeScroll 160s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

