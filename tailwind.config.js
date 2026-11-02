/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        status: {
          available: {
            bg: '#ecfdf5',
            text: '#065f46',
            border: '#a7f3d0',
            badge: '#10b981',
          },
          booked: {
            bg: '#fef2f2',
            text: '#991b1b',
            border: '#fecaca',
            badge: '#ef4444',
          },
          cleaning: {
            bg: '#fffbeb',
            text: '#92400e',
            border: '#fde68a',
            badge: '#f59e0b',
          },
          checkedIn: {
            bg: '#eff6ff',
            text: '#1e40af',
            border: '#bfdbfe',
            badge: '#3b82f6',
          },
          checkedOut: {
            bg: '#f3f4f6',
            text: '#374151',
            border: '#e5e7eb',
            badge: '#6b7280',
          },
        },
      },
    },
  },
  plugins: [],
};
