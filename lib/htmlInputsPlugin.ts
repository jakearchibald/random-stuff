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
      const allHtmlFiles = glob.sync('apps/**/*.html', {
        cwd: resolve(root),
        absolute: true,
      });

      const objPath = [
        'environments',
        'client',
        'build',
        'rollupOptions',
        'input',
      ];

      let obj = config;
      for (const segment of objPath) {
        if (!(segment in obj)) (obj as any)[segment] = {};
        obj = (obj as any)[segment];
      }

      for (const file of allHtmlFiles) {
        // Use the directory name (relative to root) as the key
        const rel = file.replace(resolve(root) + '/apps/', '');
        const key = rel.replace(/\/.*\.html$/, '');
        // @ts-ignore fuck it
        config.environments.client.build.rollupOptions.input[key] = file;
      }
    },
  };
}
