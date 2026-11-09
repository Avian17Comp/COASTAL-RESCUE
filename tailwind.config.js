module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { navy: { 950: '#0B1325', 900: '#0F172A' } },
      fontFamily: { sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'] },
      keyframes: { fadeIn: { from: { opacity: 0, transform: 'scale(.94)' }, to: { opacity: 1, transform: 'scale(1)' } } },
      animation: { 'fade-in': 'fadeIn 1s ease-out both' },
    },
  },
};
