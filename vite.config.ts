// This is a minimal Vite config that just imports from the config directory
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import the actual config
import baseConfig from './config/vite.config.ts';

export default defineConfig({
  ...baseConfig
});