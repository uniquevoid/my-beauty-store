/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: '#FAF7F2',       // Off-white/cream background
        terracotta: '#E07A5F', // Warm orange/earthy accent
        argan: '#D4A373',      // Golden oil color
        charcoal: '#2B2B2B',   // Soft black for text
        brand: {
          primary: 'var(--brand-primary, #0066CC)',
          'primary-foreground': 'var(--brand-primary-foreground, #FFFFFF)',
          'muted-on-primary': 'var(--brand-muted-on-primary, rgba(255, 255, 255, 0.85))',
          accent: 'var(--brand-accent, #FFD100)',
          'accent-foreground': 'var(--brand-accent-foreground, #1A1A1A)',
          'nav-link': 'var(--brand-nav-link, #0066CC)',
          highlight: 'var(--brand-highlight, #E91E8C)',
          background: 'var(--brand-background, #FAF7F2)',
          text: 'var(--brand-text, #2B2B2B)',
          footer: 'var(--brand-footer-background, #0B1A33)',
          'footer-accent-border': 'var(--brand-footer-accent-border)',
          surface: 'var(--brand-surface, #F4F4F5)',
          'surface-text': 'var(--brand-surface-text, #2B2B2B)',
        },
      },
      backgroundImage: {
        'hero-overlay': 'var(--brand-hero-overlay)',
        'brand-footer-accent-border': 'var(--brand-footer-accent-border)',
      },
      fontFamily: {
        sans: ['var(--brand-font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--brand-font-heading)', 'var(--brand-font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--brand-font-heading)', 'var(--brand-font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        brand: 'var(--brand-radius, 9999px)',
        'brand-btn': 'var(--brand-btn-radius, 9999px)',
      }
    },
  },
  plugins: [],
}
