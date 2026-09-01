import { promises as fs } from 'fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { glob } from 'glob';

const indexPath = new URL('../public/index.html', import.meta.url);
const indexFilePath = fileURLToPath(indexPath);
const stylesPath = new URL('./index-page/styles.css', import.meta.url);
const searchScriptPath = new URL('./index-page/search.js', import.meta.url);

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractHTMLTitle(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/s);
  return match ? decodeEntities(match[1].trim()) : '';
}

function extractScriptTitle(script: string): string {
  const match = script.match(/^\/\/\s*title:(.*)/im);
  return match?.[1].trim() || '';
}

async function writeIfChanged(filePath: string | URL, content: string) {
  const current = await fs.readFile(filePath, 'utf8').catch(() => null);
  if (current !== content) await fs.writeFile(filePath, content);
}

interface Entry {
  path: string;
  title: string;
}

interface TreeNode {
  children: Map<string, TreeNode>;
  entry?: Entry;
}

function buildTree(entries: Entry[]): TreeNode {
  const root: TreeNode = { children: new Map() };

  for (const entry of entries) {
    const parts = entry.path.split('/');
    let current = root;

    for (const [i, part] of parts.entries()) {
      if (!current.children.has(part)) {
        current.children.set(part, { children: new Map() });
      }
      current = current.children.get(part)!;
      if (i === parts.length - 1) current.entry = entry;
    }
  }

  return root;
}

function renderTree(node: TreeNode, indent: string): string {
  const items: string[] = [];

  for (const [name, child] of node.children) {
    const parts: string[] = [];

    if (child.entry) {
      const { path, title } = child.entry;
      parts.push(
        `<a href="/${escapeHTML(path)}/">` +
          `<span class="name">${escapeHTML(name)}</span>` +
          (title ? `<span class="desc">${escapeHTML(title)}</span>` : '') +
          `</a>`,
      );
    } else {
      parts.push(`<span class="group-name">${escapeHTML(name)}</span>`);
    }

    // A directory can be a page in its own right and still have children.
    if (child.children.size) {
      parts.push(
        `<ul class="nested">\n` +
          renderTree(child, indent + '    ') +
          `${indent}  </ul>`,
      );
    }

    const className = child.entry ? 'item' : 'group';
    items.push(
      `${indent}<li class="${className}">` +
        parts.join(`\n${indent}  `) +
        `</li>\n`,
    );
  }

  return items.join('');
}

export function publicIndexPlugin(): Plugin {
  async function generateIndex() {
    const paths = [
      ...(await glob('public/**/index.html')),
      ...(await glob('apps/*/index.html')),
      ...(await glob('worker-src/routes/*/index.ts')),
    ]
      // The generated index itself isn't a project.
      .filter((path) => path !== 'public/index.html');

    const entries = (
      await Promise.all(
        paths.map(async (path): Promise<Entry> => {
          const dirName = (() => {
            if (path.endsWith('.ts')) {
              return path
                .replace(/\/index\.ts$/, '')
                .replace(/^worker-src\/routes\//, '');
            } else if (path.startsWith('public/')) {
              return path
                .replace(/\/index\.html$/, '')
                .replace(/^public\//, '');
            } else if (path.startsWith('apps/')) {
              return path.replace(/\/index\.html$/, '');
            }
            throw Error('Unknown path');
          })();

          const fileContent = await fs.readFile(
            new URL('../' + path, import.meta.url),
            'utf8',
          );

          const title = path.endsWith('.html')
            ? extractHTMLTitle(fileContent)
            : extractScriptTitle(fileContent);

          return { path: dirName, title };
        }),
      )
    ).sort((a, b) => a.path.localeCompare(b.path));

    const [styles, searchScript] = await Promise.all([
      fs.readFile(stylesPath, 'utf8'),
      fs.readFile(searchScriptPath, 'utf8'),
    ]);

    const html = `<!DOCTYPE html>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Index</title>
<style>
${styles.trim()}
</style>
<div class="page">
  <header>
    <h1>Random stuff</h1>
    <div class="search">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14.5 14.5"/>
      </svg>
      <input id="search" type="search" autofocus autocomplete="off" spellcheck="false"
        placeholder="Search ${entries.length} pages…" aria-label="Search pages">
    </div>
    <p class="status" id="status" role="status"></p>
  </header>
  <main>
    <ul class="tree" id="tree">
${renderTree(buildTree(entries), '      ')}    </ul>
    <ul class="results" id="results" hidden></ul>
  </main>
</div>
<script type="application/json" id="entry-data">${JSON.stringify(
      entries,
    ).replace(/</g, '\\u003c')}</script>
<script type="module">
${searchScript.trim()}
</script>
`;

    await writeIfChanged(indexPath, html);
  }

  return {
    name: 'vite-plugin-public-index',
    async buildStart() {
      await generateIndex();
    },
    async handleHotUpdate({ file }) {
      // Generating writes public/index.html, which fires this hook again. The
      // content is stable so writeIfChanged normally breaks the cycle, but if
      // anything else is writing the file too — an old dev server left
      // watching after a config restart, say — the two take turns rewriting
      // it forever. The generated file is an output, so never treat it as a
      // reason to regenerate.
      if (file === indexFilePath) return;
      await generateIndex();
    },
  };
}
