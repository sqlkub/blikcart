import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1A3C5E', 700: '#173D66', 800: '#112E4D' },
        gold: { DEFAULT: '#C8860A', 600: '#A86E08' },
        cream: '#F5F0E8',
      },
    },
  },
  plugins: [],
};

export default config;
