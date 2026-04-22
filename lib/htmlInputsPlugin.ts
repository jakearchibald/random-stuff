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
      const allHtmlFiles = glob.sync('apps/**/*.html', {
        cwd: resolve(root),
        absolute: true,
      });

      const input: Record<string, string> = {};
      for (const file of allHtmlFiles) {
        const rel = file.replace(resolve(root) + '/apps/', '');
        const key = rel.replace(/\/.*\.html$/, '');
        input[key] = file;
      }

      return {
        environments: {
          client: { build: { rollupOptions: { input } } },
        },
      };
    },
  };
}
