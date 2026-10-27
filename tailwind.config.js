/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F0',
        sand: '#F1EADF',
        ink: '#15261F',
        pine: {
          50: '#F2F7F3',
          100: '#E1EEE4',
          200: '#C4DDCB',
          300: '#9DC4AA',
          400: '#70A482',
          500: '#4E8863',
          600: '#3B6C4E',
          700: '#305740',
          800: '#294636',
          900: '#233B2E',
          950: '#102019',
        },
        clay: {
          50: '#FCF4F1',
          100: '#F9E6E0',
          200: '#F2CCC0',
          300: '#E8A894',
          400: '#DC7A5D',
          500: '#D45E3D',
          600: '#C24729',
          700: '#A23822',
          800: '#863123',
          900: '#6E2D22',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 20px 60px -25px rgba(21, 38, 31, 0.25)',
        lift: '0 18px 40px -18px rgba(21, 38, 31, 0.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s ease-out both',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
