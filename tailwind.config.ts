import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        cyber: {
          DEFAULT: '#8B5CF6',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          glow: 'rgba(139, 92, 246, 0.25)',
        },
        deep: {
          DEFAULT: '#0F172A',
          900: '#0F172A',
          950: '#020617',
        },
        glass: {
          surface: 'rgba(30, 41, 59, 0.70)',
          hover: 'rgba(30, 41, 59, 0.90)',
          border: 'rgba(51, 65, 85, 0.60)',
          borderGlow: 'rgba(16, 185, 129, 0.40)',
          purpleGlow: 'rgba(139, 92, 246, 0.40)',
        },
        danger: {
          DEFAULT: '#EF4444',
          500: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.35)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          500: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.35)',
        },
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
        xl: '20px',
        '2xl': '40px',
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'mint-glow': '0 0 25px rgba(16, 185, 129, 0.25)',
        'mint-glow-lg': '0 0 45px rgba(16, 185, 129, 0.35)',
        'cyber-glow': '0 0 25px rgba(139, 92, 246, 0.25)',
        'cyber-glow-lg': '0 0 45px rgba(139, 92, 246, 0.35)',
        'danger-glow': '0 0 25px rgba(239, 68, 68, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('light', '&:where(.light, .light *)');
    }),
  ],
};

export default config;
