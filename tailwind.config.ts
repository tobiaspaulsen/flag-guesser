import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    fontFamily: {
      Josefin: ['Josefin Sans', ...defaultTheme.fontFamily.sans]
    },
    extend: {
      colors: {
        primary: {
          50: '#374151',
          100: '#4B5563',
          200: '#6B7280',
          900: '#E5E7EB'
        },
        secondary: {
          100: '#14B8A6',
          200: '#0D9488',
          600: '#5EEAD4',
          900: '#CCFBF1'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
