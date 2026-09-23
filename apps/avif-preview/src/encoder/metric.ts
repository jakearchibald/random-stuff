// Preview metric (port of preview/research/metric.py): compares images after
// low-passing both to a "recognition" scale, so blur costs little, plus
// colour error of heavily blurred images. (The Python version's artifact term
// is ~0 in practice and omitted.) Used only to pick the preview size
// automatically; visual judgement beats it for everything else.

type Plane = Float32Array;

function srgbToLinear(c: number) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** RGBA bytes -> Oklab planes. */
function toOklab(rgba: Uint8ClampedArray, n: number): [Plane, Plane, Plane] {
  const L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n);
  const lut = new Float32Array(256).map((_, i) => srgbToLinear(i));
  for (let i = 0; i < n; i++) {
    const r = lut[rgba[i * 4]], g = lut[rgba[i * 4 + 1]], b = lut[rgba[i * 4 + 2]];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    L[i] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    A[i] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    B[i] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  }
  return [L, A, B];
}

/** scipy.ndimage.gaussian_filter equivalent (mode='reflect', truncate=4). */
function gaussian(src: Plane, w: number, h: number, sigma: number): Plane {
  const radius = Math.max(1, Math.round(4 * sigma));
  const k = new Float32Array(2 * radius + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) sum += k[i + radius] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const reflect = (i: number, n: number) => {
    while (i < 0 || i >= n) i = i < 0 ? -i - 1 : 2 * n - i - 1;
    return i;
  };
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let j = -radius; j <= radius; j++) v += src[y * w + reflect(x + j, w)] * k[j + radius];
      tmp[y * w + x] = v;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let j = -radius; j <= radius; j++) v += tmp[reflect(y + j, h) * w + x] * k[j + radius];
      out[y * w + x] = v;
    }
  }
  return out;
}

function meanSsim(a: Plane, b: Plane, w: number, h: number, sigma: number) {
  const C1 = 0.01 ** 2, C2 = 0.03 ** 2, n = w * h;
  const mul = (x: Plane, y: Plane) => x.map((v, i) => v * y[i]);
  const ma = gaussian(a, w, h, sigma), mb = gaussian(b, w, h, sigma);
  const saa = gaussian(mul(a, a), w, h, sigma);
  const sbb = gaussian(mul(b, b), w, h, sigma);
  const sab = gaussian(mul(a, b), w, h, sigma);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const va = saa[i] - ma[i] ** 2, vb = sbb[i] - mb[i] ** 2, cov = sab[i] - ma[i] * mb[i];
    total += ((2 * ma[i] * mb[i] + C1) * (2 * cov + C2)) / ((ma[i] ** 2 + mb[i] ** 2 + C1) * (va + vb + C2));
  }
  return total / n;
}

/** Higher is better. Both images RGBA at the same (display) size. */
export function previewScore(ref: Uint8ClampedArray, cand: Uint8ClampedArray, w: number, h: number) {
  const n = w * h;
  const [rl, ra, rb] = toOklab(ref, n);
  const [cl, ca, cb] = toOklab(cand, n);
  const edge = Math.max(w, h);
  const sRec = edge / 96, sMid = edge / 192;
  const struct = meanSsim(gaussian(rl, w, h, sRec), gaussian(cl, w, h, sRec), w, h, sRec * 2);
  const structMid = meanSsim(gaussian(rl, w, h, sMid), gaussian(cl, w, h, sMid), w, h, sMid * 3);
  const s2 = sRec * 2;
  const dl = gaussian(rl, w, h, s2);
  const dlc = gaussian(cl, w, h, s2);
  const da = gaussian(ra, w, h, s2), dac = gaussian(ca, w, h, s2);
  const db = gaussian(rb, w, h, s2), dbc = gaussian(cb, w, h, s2);
  let colour = 0, light = 0;
  for (let i = 0; i < n; i++) {
    colour += Math.hypot(da[i] - dac[i], db[i] - dbc[i]);
    light += Math.abs(dl[i] - dlc[i]);
  }
  colour /= n;
  light /= n;
  return struct + 0.5 * structMid - 4 * colour - 2 * light;
}
