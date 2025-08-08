import { promises as fs } from 'fs';
import { Plugin } from 'vite';
import { glob } from 'glob';
import dedent from 'dedent';

function extractHTMLTitle(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/);
  return match?.[1].trim() || '';
}

function extractScriptTitle(script: string): string {
  const match = script.match(/^\/\/\s*title:(.*)/im);
  return match?.[1].trim() || '';
}

async function writeIfChanged(filePath: string | URL, content: string) {
  const current = await fs.readFile(filePath, 'utf8').catch(() => null);
  if (current !== content) await fs.writeFile(filePath, content);
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
        ([dirName, title]) => dedent`
          <li>
            <a href="/${dirName}/">${dirName}</a>
            ${title && `- ${title}`}
          </li>
        `
      )
      .join('\n');

    const html = dedent`
      <!DOCTYPE html>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Index</title>
      <ul>
        ${links}
      </ul>
    `;

    const indexPath = new URL('../public/index.html', import.meta.url);

    await writeIfChanged(indexPath, html);
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
