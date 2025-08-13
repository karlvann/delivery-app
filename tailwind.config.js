/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel color palette inspired by Stripe
        pastel: {
          blue: '#E0F2FE',
          purple: '#F3E8FF',
          pink: '#FCE7F3',
          green: '#D1FAE5',
          yellow: '#FEF3C7',
          orange: '#FED7AA',
        },
        brand: {
          primary: '#6366F1', // Soft indigo
          secondary: '#8B5CF6', // Soft purple
          accent: '#EC4899', // Soft pink
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
