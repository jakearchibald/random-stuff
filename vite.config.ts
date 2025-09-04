import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import preact from '@preact/preset-vite';
import { publicIndexPlugin } from './lib/publicIndexPlugin';
import { htmlInputsPlugin } from './lib/htmlInputsPlugin';
import { simpleBCDDataPlugin } from './lib/simpleBCDDataPlugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    cloudflare({
      experimental: { headersAndRedirectsDevModeSupport: true },
      configPath: '../wrangler.jsonc',
    }),
    publicIndexPlugin(),
    preact(),
    htmlInputsPlugin(),
    simpleBCDDataPlugin(),
  ],
  publicDir: resolve(__dirname, 'public'),
  root: resolve(__dirname, 'src'),
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, 'dist'),
  },
});
