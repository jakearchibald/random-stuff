import type { ThemedToken } from 'shiki';
import { background, foreground } from './highlighter';

// Shiki's FontStyle flags.
const Italic = 1;
const Bold = 2;

export const fontFamily = 'Inconsolata, courier, monospace';
// Matches .code-example on jakearchibald.com.
const lineHeight = 1.4;

export interface RenderOptions {
  tokens: ThemedToken[][];
  fontSize: number;
  padding: number;
  scale: number;
}

function fontFor(token: ThemedToken, fontSize: number) {
  const style = token.fontStyle ?? 0;
  const italic = style & Italic ? 'italic ' : '';
  const bold = style & Bold ? 'bold ' : '';
  return `${italic}${bold}${fontSize}px ${fontFamily}`;
}

/** Draw the code, plus padding, onto the canvas, resizing it to fit. */
export function renderCode(
  canvas: HTMLCanvasElement,
  { tokens, fontSize, padding, scale }: RenderOptions,
) {
  const ctx = canvas.getContext('2d')!;
  const lineBox = fontSize * lineHeight;

  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText('M');
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  // Position the baseline as CSS would within a line box.
  const baselineOffset = (lineBox - (ascent + descent)) / 2 + ascent;

  const lines = tokens.map((line) =>
    line.map((token) => {
      ctx.font = fontFor(token, fontSize);
      return { token, width: ctx.measureText(token.content).width };
    }),
  );

  const contentWidth = Math.max(
    0,
    ...lines.map((line) => line.reduce((sum, { width }) => sum + width, 0)),
  );
  const width = contentWidth + padding * 2;
  const height = lines.length * lineBox + padding * 2;

  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  canvas.style.width = `${canvas.width / scale}px`;
  canvas.style.height = `${canvas.height / scale}px`;

  ctx.scale(scale, scale);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'alphabetic';

  lines.forEach((line, i) => {
    let x = padding;
    const y = padding + i * lineBox + baselineOffset;
    for (const { token, width } of line) {
      ctx.font = fontFor(token, fontSize);
      ctx.fillStyle = token.color ?? foreground;
      ctx.fillText(token.content, x, y);
      x += width;
    }
  });
}
