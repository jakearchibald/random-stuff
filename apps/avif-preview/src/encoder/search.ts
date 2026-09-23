import { EncoderPool } from './pool';
import {
  type FloatImage,
  LANCZOS,
  backproject,
  fit,
  resample,
  toRgba,
} from './image';
import { previewScore } from './metric';

export interface EncodeOptions {
  /** Maximum preview size in bytes (used when quantizer is 'auto'). */
  budget: number;
  /** Long edge of the coded image, or 'auto' to pick by the metric. */
  size: 'auto' | number;
  /** libaom quantizer 32 (finer) .. 63 (coarser), or 'auto': finest that fits the budget. */
  quantizer: 'auto' | number;
  /** Wiener taps "y0,y1,y2/c1,c2" (the blur baked into the file). */
  wiener: string;
  /** libaom speed 0 (slowest, best) .. 4. */
  speed: number;
  /** Back-projection iterations (sharpening), 0 = plain Lanczos downscale. */
  sharpen: number;
  /** Long edge the preview is judged at when choosing a size automatically. */
  displaySize: number;
}

export interface Candidate {
  edge: number;
  width: number;
  height: number;
  quantizer: number;
  blob: Uint8Array;
  fits: boolean;
  score?: number;
}

// Small sizes only matter for tiny budgets (e.g. ThumbHash-sized), and are cheap.
export const AUTO_EDGES = [8, 12, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112];

let pool: EncoderPool | undefined;
const getPool = () => (pool ??= new EncoderPool());

export interface Progress {
  done: number;
  total: number;
}

/** Encode `source` with `opts`. Returns every size tried, best first. */
export async function encodePreview(
  source: FloatImage,
  opts: EncodeOptions,
  onProgress: (p: Progress) => void,
  signal: AbortSignal
): Promise<Candidate[]> {
  const encoder = getPool();
  const edges = opts.size === 'auto' ? AUTO_EDGES : [opts.size];
  const [dispW, dispH] = fit(source.width, source.height, opts.displaySize);
  // Rough total for the progress bar: ~log2(32) encodes per size when searching.
  const perEdge = opts.quantizer === 'auto' ? 5 : 1;
  const progress = { done: 0, total: edges.length * perEdge };
  onProgress({ ...progress });

  const encodeOne = async (rgba: Uint8ClampedArray, width: number, height: number, quantizer: number) => {
    const blob = await encoder.encode(
      { rgba, width, height, quantizer, speed: opts.speed, wiener: opts.wiener },
      signal
    );
    progress.done++;
    progress.total = Math.max(progress.total, progress.done);
    onProgress({ ...progress });
    return blob;
  };

  const candidates = await Promise.all(
    edges.map(async (edge): Promise<Candidate> => {
      const [width, height] = fit(source.width, source.height, edge);
      const small = opts.sharpen
        ? backproject(source, width, height, dispW, dispH, opts.sharpen)
        : resample(source, width, height, LANCZOS);
      const rgba = toRgba(small);
      if (opts.quantizer !== 'auto') {
        const blob = await encodeOne(rgba, width, height, opts.quantizer);
        // No budget with a fixed quantizer: every size "fits".
        return { edge, width, height, quantizer: opts.quantizer, blob, fits: true };
      }
      // Finest quantizer whose blob fits the budget.
      let lo = 32, hi = 63;
      let best: Candidate | undefined;
      let coarsest: Candidate | undefined;
      while (lo <= hi) {
        const q = (lo + hi) >> 1;
        const blob = await encodeOne(rgba, width, height, q);
        const c = { edge, width, height, quantizer: q, blob, fits: blob.length <= opts.budget };
        if (q === 63) coarsest = c;
        if (c.fits) {
          best = c;
          hi = q - 1;
        } else {
          lo = q + 1;
        }
      }
      // The search always tries 63 last when nothing fits.
      return (best ?? coarsest)!;
    })
  );

  // Judge each candidate the way it's seen: decoded by the browser, scaled up.
  const { toAvif } = await import('../decoder');
  const ref = toRgba(resample(source, dispW, dispH, LANCZOS));
  const canvas = new OffscreenCanvas(dispW, dispH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  for (const c of candidates) {
    signal.throwIfAborted();
    const bitmap = await createImageBitmap(
      new Blob([toAvif(c.blob) as Uint8Array<ArrayBuffer>], { type: 'image/avif' })
    );
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(bitmap, 0, 0, dispW, dispH);
    bitmap.close();
    c.score = previewScore(ref, ctx.getImageData(0, 0, dispW, dispH).data, dispW, dispH);
  }
  return candidates.sort((a, b) => Number(b.fits) - Number(a.fits) || b.score! - a.score!);
}
