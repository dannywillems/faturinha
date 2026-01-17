import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base URL for GitHub Pages deployment
  // Set to '/' for custom domain or '/repo-name/' for github.io/repo-name
  base: process.env.GITHUB_PAGES ? '/faturinha/' : '/',
})
