import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Get version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

// Get git commit hash
function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base URL for GitHub Pages deployment
  // Set to '/' for custom domain or '/repo-name/' for github.io/repo-name
  base: process.env.GITHUB_PAGES ? '/faturinha/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __GIT_COMMIT__: JSON.stringify(getGitCommit()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
  },
});
