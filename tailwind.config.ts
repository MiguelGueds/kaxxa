import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F6F9',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F1F3F7',
          tertiary: '#EAEAEA',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#181B22',
          light: '#262626',
          muted: '#64748B',
          tertiary: '#94A3B8',
        },
        primary: {
          DEFAULT: '#1A44C8',
          hover: '#1538A5',
          glow: 'rgba(26, 68, 200, 0.25)',
          soft: 'rgba(26, 68, 200, 0.08)',
        },
        accent: {
          emerald: '#1A44C8',
          mint: '#60A5FA',
          blue: '#2563EB',
          amber: '#F59E0B',
          rose: '#EF4444',
        },
        hairline: {
          DEFAULT: '#E5E7EB',
          strong: '#CBD5E1',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Space Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(26, 68, 200, 0.2)',
        'glow-sm': '0 0 10px rgba(26, 68, 200, 0.12)',
        glass: '0 4px 30px rgba(0, 0, 0, 0.05)',
        float: '0 10px 40px -10px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        card: '20px',
        panel: '24px',
      },
    },
  },
  plugins: [],
};

export default config;
