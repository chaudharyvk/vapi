/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-success': 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
        'gradient-danger': 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #718096 0%, #4a5568 100%)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': {
            boxShadow: '0 0 0 0 rgba(245, 101, 101, 0.7)',
          },
          '70%': {
            boxShadow: '0 0 0 10px rgba(245, 101, 101, 0)',
          },
          '100%': {
            boxShadow: '0 0 0 0 rgba(245, 101, 101, 0)',
          },
        },
      },
    },
  },
  plugins: [],
}
