/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#EDF2FB",
        foreground: "#1B1B1B",
        primary: {
          DEFAULT: "#0061FF",
          foreground: "#EDF2FB",
        },
        secondary: {
          DEFAULT: "#5A95FF",
          foreground: "#1B1B1B",
        },
        accent: {
          DEFAULT: "#A7C1FF",
          foreground: "#1B1B1B",
        },
        muted: {
          DEFAULT: "#A7C1FF",
          foreground: "#1B1B1B",
        },
        border: "#A7C1FF",
        // Yeni renk paleti
        'dark-green': '#1A2F25',
        'light-green': '#8FA895',
        'accent-red': '#a84833',
        'dark-red': '#873523',
        'beige-bg': '#f5f4d0',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        heading: ['EB Garamond', 'serif'],
        subheading: ['EB Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}

