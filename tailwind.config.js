/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Global brand tokens, read from CSS variables
        primary: 'var(--tb-primary, #E091A3)',
        primaryHover: 'var(--tb-primary-hover, #D67B8F)',
        secondary: 'var(--tb-secondary, #E091A3)',
        accent: 'var(--tb-accent, #E091A3)',
        page: 'var(--tb-page, #FDF2F8)',
        surface: 'var(--tb-surface, #FCE7F3)',
        border: 'var(--tb-border)',              // #E5E7EB
        text: {
          strong: 'var(--tb-text-strong)',       // #0F172A
          muted: 'var(--tb-text-muted)',         // #334155
        },

        // Optional header token used on the Executive Command Centre
        cardHeader: 'var(--tb-card-header, #0F4A4F)',
        cardHeaderText: 'var(--tb-card-header-text, #E6F5F6)',

        // Division colors, all variable driven so they can be themed centrally
        'new-patient': 'var(--tb-div-new-patient, #e6b813)',
        'hormone': 'var(--tb-div-hormone, #5c6f75)',
        'nutrition': 'var(--tb-div-nutrition, #bfb6d9)',
        'iv-therapy': 'var(--tb-div-iv-therapy, #91c4ba)',
        'laser': 'var(--tb-div-laser, #ff9680)',
        'injectables': 'var(--tb-div-injectables, #ff6a76)',
        'feminine': 'var(--tb-div-feminine, #a47d9b)',

        // Light tints for backgrounds
        'new-patient-light': 'var(--tb-div-new-patient-light, #fdf6e3)',
        'hormone-light': 'var(--tb-div-hormone-light, #f1f3f4)',
        'nutrition-light': 'var(--tb-div-nutrition-light, #f7f5fc)',
        'iv-therapy-light': 'var(--tb-div-iv-therapy-light, #f0f8f6)',
        'laser-light': 'var(--tb-div-laser-light, #fff2ed)',
        'injectables-light': 'var(--tb-div-injectables-light, #fff0f1)',
        'feminine-light': 'var(--tb-div-feminine-light, #f6f3f5)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        apple: '12px',
      },
      boxShadow: {
        apple: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'apple-lg': '0 8px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -5px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
