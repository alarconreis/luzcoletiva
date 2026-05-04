/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Luz Coletiva
        sun: {
          DEFAULT: '#FFD54F',
          50: '#FFF8E1',
          100: '#FFECB3',
          400: '#FFD54F',
          500: '#FFC107',
          600: '#FFA000',
        },
        sky: {
          DEFAULT: '#4FC3F7',
          50: '#E1F5FE',
          400: '#4FC3F7',
          500: '#29B6F6',
          600: '#039BE5',
          900: '#1565C0',
        },
        leaf: {
          DEFAULT: '#81C784',
          400: '#81C784',
          500: '#66BB6A',
        },
        ink: {
          DEFAULT: '#424242',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          400: '#9E9E9E',
          700: '#616161',
          900: '#212121',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(255, 193, 7, 0.45)',
        soft: '0 4px 24px -8px rgba(66, 66, 66, 0.15)',
        card: '0 8px 32px -12px rgba(21, 101, 192, 0.18)',
      },
      backgroundImage: {
        'sunrise': 'linear-gradient(135deg, #FFD54F 0%, #4FC3F7 55%, #81C784 100%)',
        'sunrise-soft': 'linear-gradient(135deg, #FFF8E1 0%, #E1F5FE 55%, #E8F5E9 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 8s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 0.9, transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
