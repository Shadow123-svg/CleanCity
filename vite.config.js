const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const tailwindcss = require('@tailwindcss/vite').default;

module.exports = defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 3002,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
    hmr: {
      host: '127.0.0.1',
      clientPort: 3002,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
