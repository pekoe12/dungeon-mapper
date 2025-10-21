#!/usr/bin/env node

// This script creates symlinks in the root for compatibility
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configFiles = {
  'tsconfig.json': 'config/tsconfig.json',
  'postcss.config.js': 'config/postcss.config.js',
  'tailwind.config.js': 'config/tailwind.config.js',
};

// Create symlinks for config files
Object.entries(configFiles).forEach(([target, source]) => {
  const targetPath = path.join(__dirname, target);
  const sourcePath = path.join(__dirname, source);
  
  try {
    if (!fs.existsSync(targetPath)) {
      // On Unix/Mac
      fs.symlinkSync(sourcePath, targetPath, 'file');
      console.log(`Created symlink for ${target}`);
    }
  } catch (error) {
    console.error(`Failed to create symlink for ${target}:`, error.message);
    console.log(`You may need to manually copy ${source} to ${target} or run as administrator`);
  }
});

console.log('Setup complete!');