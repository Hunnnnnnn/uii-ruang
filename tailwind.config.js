/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uii: {
          blue: "#093697",
          dark: "#0B0C0F",
          gold: "#ECCA2E",
          bg: "#F5F8FF",
          muted: "#BABABA",
          gray: "#727272",
          teal: "#C1E8E7",
          badge: "#F2F7A0",
          success: "#14926F",
          danger: "#CA0004",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
}
