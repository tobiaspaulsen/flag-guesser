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
          100: '#5F6876',
          200: '#3F4650',
          900: '#1F2937'
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
