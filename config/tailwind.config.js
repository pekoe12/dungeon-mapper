import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    resolve(ROOT, 'index.html'),
    resolve(ROOT, 'src/**/*.{js,ts,jsx,tsx}')
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
