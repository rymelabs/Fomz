/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
            // Shrink default font sizing scale for a more compact look
            fontSize: {
              xs: ['0.6875rem', { lineHeight: '1rem' }], // 11px
              sm: ['0.8125rem', { lineHeight: '1rem' }], // 13px
              base: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
              lg: ['1rem', { lineHeight: '1.5rem' }], // 16px
              xl: ['1.0625rem', { lineHeight: '1.5rem' }], // 17px
              '2xl': ['1.25rem', { lineHeight: '1.75rem' }], // 20px
              '3xl': ['1.5rem', { lineHeight: '1.75rem' }], // 24px
              '4xl': ['1.75rem', { lineHeight: '1.1' }], // 28px
              '5xl': ['2.25rem', { lineHeight: '1.05' }], // 36px
            },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      fontFamily: {
        // Body and UI font defaults to Poppins
        sans: ['Poppins', 'sans-serif'],
        // Display / brand use Inria Serif for headings & logos
        display: ['Inria Serif', 'serif'],
        brand: ['Inria Serif', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-green': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-mixed': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-soft': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'gradient-xy': 'gradient-xy 6s ease infinite',
        'shooting-star': 'shooting 3s linear infinite',
        'card-enter': 'cardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'text-enter': 'textEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(40px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-40px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        cardEnter: {
          '0%': { transform: 'translateY(40px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        textEnter: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shooting: {
          '0%': { transform: 'translateX(0) translateY(0) rotate(45deg)', opacity: '1' },
          '100%': { transform: 'translateX(calc(100vh + 100vw)) translateY(calc(100vh + 100vw)) rotate(45deg)', opacity: '0' },
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
