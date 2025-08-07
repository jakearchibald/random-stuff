import { promises as fs } from 'fs';
import { Plugin } from 'vite';
import { glob } from 'glob';

function extractHTMLTitle(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/);
  return match ? match[1].trim() : '';
}

function extractScriptTitle(script: string): string {
  const match = script.match(/^\/\/\s*title:(.*)/im);
  return match ? match[1].trim() : '';
}

export function publicIndexPlugin(): Plugin {
  async function generateIndex() {
    const paths = [
      ...(await glob('public/*/index.html')),
      ...(await glob('src/routes/*/index.ts')),
    ];

    const entries = (
      await Promise.all(
        paths.map(async (path) => {
          const dirName =
            /^(public|src\/routes)\/([^/]*)\/index\.(html|ts)$/.exec(
              path
            )?.[2]!;

          const fileContent = await fs.readFile(
            new URL('../' + path, import.meta.url),
            'utf8'
          );

          const title = path.endsWith('.html')
            ? extractHTMLTitle(fileContent)
            : extractScriptTitle(fileContent);

          return [dirName, title];
        })
      )
    ).sort((a, b) => a[0].localeCompare(b[0]));

    const links = entries
      .map(
        ([dirName, title]) =>
          `<li><a href="/${dirName}/">${dirName}</a> ${title}</li>`
      )
      .join('\n');

    const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Index</title>
      </head>
      <body>
        <ul>
          ${links}
        </ul>
      </body>
      </html>`;

    const indexPath = new URL('../public/index.html', import.meta.url);

    let current;

    try {
      current = await fs.readFile(indexPath, 'utf8');
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
      current = null;
    }

    if (current === html) return;
    await fs.writeFile(indexPath, html);
  }

  return {
    name: 'vite-plugin-public-index',
    async buildStart() {
      await generateIndex();
    },
    async handleHotUpdate() {
      await generateIndex();
    },
  };
}
