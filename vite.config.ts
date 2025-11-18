import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Determine base path for GitHub Pages deployment
// Priority: VITE_BASE_URL env var > auto-detect from package.json > fallback to '/'
const getBasePath = () => {
  if (process.env.VITE_BASE_URL) {
    return process.env.VITE_BASE_URL;
  }

  // Auto-detect from package.json for GitHub Pages
  // If repository is username/repo-name, base should be /repo-name/
  try {
    const packageJson = require('./package.json');
    const repoMatch = packageJson.repository?.url?.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
    if (repoMatch && repoMatch[2] !== repoMatch[1] + '.github.io') {
      return `/${repoMatch[2].replace(/\.git$/, '')}/`;
    }
  } catch (e) {
    // Fallback to root if detection fails
  }

  return '/';
};

export default defineConfig({
  plugins: [react()],
  base: getBasePath(),
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
