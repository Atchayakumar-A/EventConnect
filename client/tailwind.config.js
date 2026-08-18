/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        calm: {
          bg: '#FAF9F5',           // Soft warm cream
          surface: '#FFFFFF',      // Pure white surface
          card: '#F4F3ED',         // Warm soft neutral card fill
          border: '#E6E4DC',       // Muted soft border
          sage: {
            DEFAULT: '#5F8670',    // Sage green primary accent
            light: '#E8EFEA',
            dark: '#486856',
          },
          teal: {
            DEFAULT: '#3A7CA5',    // Soft calming teal secondary
            light: '#E8F2F8',
            dark: '#2B5B7A',
          },
          text: {
            primary: '#2D3748',    // Deep slate charcoal
            secondary: '#64748B',  // Muted slate gray
            light: '#94A3B8',      // Soft placeholder text
          },
          terracotta: '#D97767',   // Soft warm accent highlight
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'calm-sm': '0 2px 8px -2px rgba(45, 55, 72, 0.05)',
        'calm-md': '0 8px 24px -4px rgba(45, 55, 72, 0.08)',
        'calm-lg': '0 16px 36px -6px rgba(45, 55, 72, 0.12)',
      }
    },
  },
  plugins: [],
}
