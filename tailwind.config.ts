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
          50: '#E5E7EB',
          100: '#6B7280',
          200: '#4B5563',
          900: '#374151'
        },
        secondary: {
          100: '#CCFBF1',
          200: '#5EEAD4',
          600: '#14B8A6',
          900: '#0D9488'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
