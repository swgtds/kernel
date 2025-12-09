import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['"JetBrains Mono"', 'sans-serif'],
        headline: ['"JetBrains Mono"', 'sans-serif'],
        code: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Everforest color palette
        everforest: {
          // Dark palette (medium contrast)
          dark: {
            bg: {
              dim: '#232A2E',
              0: '#2D353B', 
              1: '#343F44',
              2: '#3D484D',
              3: '#475258',
              4: '#4F585E', 
              5: '#56635f',
              visual: '#543A48',
              red: '#514045',
              yellow: '#4D4C43',
              green: '#425047',
              blue: '#3A515D',
              purple: '#4A444E'
            },
            fg: '#D3C6AA',
            red: '#E67E80',
            orange: '#E69875', 
            yellow: '#DBBC7F',
            green: '#A7C080',
            aqua: '#83C092',
            blue: '#7FBBB3',
            purple: '#D699B6',
            grey: {
              0: '#7A8478',
              1: '#859289',
              2: '#9DA9A0'
            },
            statusline: {
              1: '#A7C080',
              2: '#D3C6AA', 
              3: '#E67E80'
            }
          },
          // Light palette (medium contrast)  
          light: {
            bg: {
              dim: '#EFEBD4',
              0: '#FDF6E3',
              1: '#F4F0D9', 
              2: '#EFEBD4',
              3: '#E6E2CC',
              4: '#E0DCC7',
              5: '#BDC3AF',
              visual: '#EAEDC8',
              red: '#FDE3DA',
              yellow: '#FAEDCD',
              green: '#F0F1D2',
              blue: '#E9F0E9', 
              purple: '#FAE8E2'
            },
            fg: '#5C6A72',
            red: '#F85552',
            orange: '#F57D26',
            yellow: '#DFA000',
            green: '#8DA101',
            aqua: '#35A77C',
            blue: '#3A94C5',
            purple: '#DF69BA',
            grey: {
              0: '#A6B0A0',
              1: '#939F91', 
              2: '#829181'
            },
            statusline: {
              1: '#93B259',
              2: '#708089',
              3: '#E66868'
            }
          }
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
