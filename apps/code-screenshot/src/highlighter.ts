import {
  bundledLanguages,
  createHighlighter,
  type BundledLanguage,
  type HighlighterGeneric,
  type ThemedToken,
} from 'shiki';
import { loadPatchedCSS } from './css-grammar-patch';

// Matches jakearchibald.com (lib/shiki-highlighter.mjs).
export const theme = 'dark-plus';
// The site overrides Shiki's background with its own.
export const background = '#2d2d2d';
export const foreground = '#d4d4d4';

type Highlighter = HighlighterGeneric<BundledLanguage, typeof theme>;

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighterPromise ??= createHighlighter({ themes: [theme], langs: [] });
  return highlighterPromise;
}

async function ensureLanguage(highlighter: Highlighter, lang: BundledLanguage) {
  if (highlighter.getLoadedLanguages().includes(lang)) return;
  if (lang === 'css') {
    await highlighter.loadLanguage(await loadPatchedCSS());
    return;
  }
  const hadPatchedCSS = highlighter.getLoadedLanguages().includes('css');
  await highlighter.loadLanguage(lang);
  // Languages that embed CSS (e.g. HTML) bring the unpatched grammar with
  // them, so put the patched one back.
  if (hadPatchedCSS || highlighter.getLoadedLanguages().includes('css')) {
    await highlighter.loadLanguage(await loadPatchedCSS());
  }
}

export function isLanguage(lang: string): lang is BundledLanguage {
  return lang in bundledLanguages;
}

export async function tokenize(
  code: string,
  lang: BundledLanguage,
): Promise<ThemedToken[][]> {
  const highlighter = await getHighlighter();
  await ensureLanguage(highlighter, lang);
  return highlighter.codeToTokensBase(code, { lang, theme });
}
