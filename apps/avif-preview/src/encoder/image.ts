// Image helpers: loading, PIL-style separable resampling, back-projection.

/** Float RGB image, values 0..255. */
export interface FloatImage {
  width: number;
  height: number;
  data: Float32Array; // RGB interleaved
}

/** Largest source edge worth keeping; previews are at most 128px. */
const WORKING_EDGE = 1024;

/** Decode a file (honouring EXIF orientation) into a working-size float image. */
export async function loadImage(file: Blob): Promise<FloatImage> {
  const probe = await createImageBitmap(file);
  const scale = Math.min(1, WORKING_EDGE / Math.max(probe.width, probe.height));
  const width = Math.max(1, Math.round(probe.width * scale));
  const height = Math.max(1, Math.round(probe.height * scale));
  const bitmap =
    scale < 1
      ? await createImageBitmap(file, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' })
      : probe;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })!;
  ctx.drawImage(bitmap, 0, 0);
  probe.close();
  bitmap.close();
  const rgba = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' }).data;
  const data = new Float32Array(width * height * 3);
  for (let i = 0, p = 0; p < rgba.length; p += 4) {
    // Composite any transparency onto white.
    const a = rgba[p + 3] / 255;
    data[i++] = rgba[p] * a + 255 * (1 - a);
    data[i++] = rgba[p + 1] * a + 255 * (1 - a);
    data[i++] = rgba[p + 2] * a + 255 * (1 - a);
  }
  return { width, height, data };
}

/** Fit (w, h) inside `edge` on the long side, both even and >= 2. */
export function fit(w: number, h: number, edge: number): [number, number] {
  let nw: number, nh: number;
  if (w >= h) {
    nw = edge;
    nh = Math.max(2, Math.round((h * edge) / w));
  } else {
    nh = edge;
    nw = Math.max(2, Math.round((w * edge) / h));
  }
  return [nw - (nw % 2), nh - (nh % 2)];
}

type Filter = { support: number; fn: (x: number) => number };

const sinc = (x: number) => (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
export const LANCZOS: Filter = {
  support: 3,
  fn: (x) => (Math.abs(x) < 3 ? sinc(x) * sinc(x / 3) : 0),
};
export const BILINEAR: Filter = {
  support: 1,
  fn: (x) => Math.max(0, 1 - Math.abs(x)),
};

/** Precompute resampling weights (PIL's approach: widen the filter when downscaling). */
function weights(inSize: number, outSize: number, filter: Filter) {
  const scale = inSize / outSize;
  const fscale = Math.max(1, scale);
  const support = filter.support * fscale;
  const taps: { start: number; w: Float32Array }[] = [];
  for (let o = 0; o < outSize; o++) {
    const center = (o + 0.5) * scale;
    const start = Math.max(0, Math.floor(center - support));
    const end = Math.min(inSize, Math.ceil(center + support));
    const w = new Float32Array(end - start);
    let sum = 0;
    for (let i = start; i < end; i++) {
      const v = filter.fn((i + 0.5 - center) / fscale);
      w[i - start] = v;
      sum += v;
    }
    for (let k = 0; k < w.length; k++) w[k] /= sum || 1;
    taps.push({ start, w });
  }
  return taps;
}

/** Separable resample of a 3-channel float image. */
export function resample(src: FloatImage, width: number, height: number, filter: Filter): FloatImage {
  const hw = weights(src.width, width, filter);
  const vw = weights(src.height, height, filter);
  const tmp = new Float32Array(width * src.height * 3);
  for (let y = 0; y < src.height; y++) {
    const row = y * src.width * 3;
    for (let x = 0; x < width; x++) {
      const { start, w } = hw[x];
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < w.length; k++) {
        const p = row + (start + k) * 3;
        r += src.data[p] * w[k];
        g += src.data[p + 1] * w[k];
        b += src.data[p + 2] * w[k];
      }
      const o = (y * width + x) * 3;
      tmp[o] = r;
      tmp[o + 1] = g;
      tmp[o + 2] = b;
    }
  }
  const out = new Float32Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    const { start, w } = vw[y];
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < w.length; k++) {
        const p = ((start + k) * width + x) * 3;
        r += tmp[p] * w[k];
        g += tmp[p + 1] * w[k];
        b += tmp[p + 2] * w[k];
      }
      const o = (y * width + x) * 3;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
    }
  }
  return { width, height, data: out };
}

/**
 * Pick the small image whose bilinear upscale best matches the original at
 * display size (iterative back-projection). This sharpens the preview.
 */
export function backproject(
  src: FloatImage,
  width: number,
  height: number,
  dispW: number,
  dispH: number,
  iterations: number
): FloatImage {
  const ref = resample(src, dispW, dispH, LANCZOS);
  const x = resample(src, width, height, LANCZOS);
  for (let it = 0; it < iterations; it++) {
    const up = resample(clamp(x), dispW, dispH, BILINEAR);
    const err = new Float32Array(ref.data.length);
    for (let i = 0; i < err.length; i++) err[i] = ref.data[i] - up.data[i];
    const down = resample({ width: dispW, height: dispH, data: err }, width, height, LANCZOS);
    for (let i = 0; i < x.data.length; i++) x.data[i] += down.data[i];
  }
  return clamp(x);
}

function clamp(img: FloatImage): FloatImage {
  const data = new Float32Array(img.data.length);
  for (let i = 0; i < data.length; i++) data[i] = Math.min(255, Math.max(0, img.data[i]));
  return { ...img, data };
}

/** Float RGB -> RGBA bytes. */
export function toRgba(img: FloatImage): Uint8ClampedArray {
  const out = new Uint8ClampedArray(img.width * img.height * 4);
  for (let i = 0, p = 0; p < out.length; p += 4) {
    out[p] = Math.round(img.data[i++]);
    out[p + 1] = Math.round(img.data[i++]);
    out[p + 2] = Math.round(img.data[i++]);
    out[p + 3] = 255;
  }
  return out;
}
