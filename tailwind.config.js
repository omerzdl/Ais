/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#1E293B",
        primary: {
          DEFAULT: "#153A60", // Dark Navy from logo 's' character
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#80E0FF", // Light blue/ice blue glow from logo
          foreground: "#1E293B",
        },
        accent: {
          DEFAULT: "#FF8C00", // Vibrant orange from logo droplet
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F8FAFC", // Very light gray for backgrounds
          foreground: "#1E293B",
        },
        border: "#E2E8F0",
        // Brand color aliases
        'brand-navy': '#153A60',
        'brand-orange': '#FF8C00',
        'brand-glow': '#80E0FF',
        'brand-anthracite': '#1E293B',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        subheading: ['EB Garamond', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
    },
  },
  plugins: [],
}

