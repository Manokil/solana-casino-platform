/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        sidebar: 'var(--sidebar)',
        card: 'var(--card)',
        'card-hover': 'var(--card-hover)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        error: 'var(--error)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      backgroundColor: {
        'background-80': 'rgba(20, 21, 23, 0.8)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text-primary)',
            a: {
              color: 'var(--accent)',
              '&:hover': {
                color: 'var(--accent-hover)',
              },
            },
            h1: {
              color: 'var(--text-primary)',
            },
            h2: {
              color: 'var(--text-primary)',
            },
            h3: {
              color: 'var(--text-primary)',
            },
            h4: {
              color: 'var(--text-primary)',
            },
            strong: {
              color: 'var(--text-primary)',
            },
            code: {
              color: 'var(--accent)',
            },
            blockquote: {
              color: 'var(--text-secondary)',
              borderLeftColor: 'var(--border)',
            },
          },
        },
      },
    },
  },
  plugins: [],
};