import type { Plugin } from 'vite';
import { glob } from 'glob';
import { resolve } from 'node:path';

/**
 * Vite plugin to set all HTML files in the src directory as rollup input entries.
 */
export function htmlInputsPlugin(): Plugin {
  return {
    name: 'html-inputs-plugin',
    config(config, { command }) {
      if (command !== 'build') return;
      const root = config.root || process.cwd();
      // Find all HTML files in src recursively
      const allHtmlFiles = glob.sync('src/**/*.html', {
        cwd: resolve(root),
        absolute: true,
      });

      if (!config.build) config.build = {};
      if (!config.build.rollupOptions) config.build.rollupOptions = {};
      config.build.rollupOptions.input = {};

      for (const file of allHtmlFiles) {
        // Use the directory name (relative to root) as the key
        const rel = file.replace(resolve(root) + '/', '');
        const key = rel.replace(/\/.*\.html$/, '');
        config.build.rollupOptions.input[key] = file;
      }
    },
  };
}
