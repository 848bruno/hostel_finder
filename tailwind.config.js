/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        // Override the default blue, sky, and indigo palettes to dynamically scale with our --primary CSS variable
        blue: {
          50: 'color-mix(in hsl, hsl(var(--primary)) 10%, transparent)',
          100: 'color-mix(in hsl, hsl(var(--primary)) 20%, transparent)',
          200: 'color-mix(in hsl, hsl(var(--primary)) 30%, transparent)',
          300: 'color-mix(in hsl, hsl(var(--primary)) 40%, transparent)',
          400: 'color-mix(in hsl, hsl(var(--primary)) 60%, transparent)',
          500: 'hsl(var(--primary))',
          600: 'color-mix(in hsl, hsl(var(--primary)) 80%, black)',
          700: 'color-mix(in hsl, hsl(var(--primary)) 60%, black)',
          800: 'color-mix(in hsl, hsl(var(--primary)) 40%, black)',
          900: 'color-mix(in hsl, hsl(var(--primary)) 20%, black)',
        },
        indigo: {
          50: 'color-mix(in hsl, hsl(var(--primary)) 15%, transparent)',
          100: 'color-mix(in hsl, hsl(var(--primary)) 25%, transparent)',
          400: 'color-mix(in hsl, hsl(var(--primary)) 50%, black)',
          500: 'color-mix(in hsl, hsl(var(--primary)) 70%, black)',
          600: 'color-mix(in hsl, hsl(var(--primary)) 85%, black)',
        },
        sky: {
          50: 'color-mix(in hsl, hsl(var(--primary)) 8%, transparent)',
          100: 'color-mix(in hsl, hsl(var(--primary)) 15%, transparent)',
        }
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
