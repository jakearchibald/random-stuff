/// <reference lib="webworker" />
// Encoder worker: RGBA -> YUV 4:4:4 -> AV1 (patched libaom, wasm) -> preview blob.
import factory from './wasm/aom_preview.js';
import type { AomPreviewModule } from './wasm/aom_preview.js';
import {
  BitWriter,
  HEADER_BITS,
  MAX_DIMENSION,
  QINDEX,
  QUANTIZER_MIN,
  frameHeader,
  sequenceHeader,
} from '../decoder';

export interface EncodeRequest {
  id: number;
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  quantizer: number;
  speed: number;
  /** "y0,y1,y2/c1,c2": outer Wiener taps in 1/128 units. */
  wiener: string;
}

export type EncodeResponse =
  | { id: number; blob: Uint8Array }
  | { id: number; error: string };

const modulePromise: Promise<AomPreviewModule> = factory();

/** RGB -> BT.601 full-range YUV 4:4:4 (what the sequence header signals). */
function toYuv444(rgba: Uint8ClampedArray, width: number, height: number) {
  const n = width * height;
  const y = new Uint8Array(n);
  const u = new Uint8Array(n);
  const v = new Uint8Array(n);
  const clamp = (x: number) => Math.min(255, Math.max(0, Math.round(x)));
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const r = rgba[p], g = rgba[p + 1], b = rgba[p + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    y[i] = clamp(luma);
    u[i] = clamp((b - luma) / 1.772 + 128);
    v[i] = clamp((r - luma) / 1.402 + 128);
  }
  return { y, u, v };
}

/** Split an OBU stream into {type: payload}. */
function splitObus(data: Uint8Array) {
  const obus = new Map<number, Uint8Array>();
  let i = 0;
  while (i < data.length) {
    const header = data[i++];
    const type = (header >> 3) & 15;
    if ((header >> 2) & 1) i++; // extension
    let size = data.length - i;
    if ((header >> 1) & 1) {
      size = 0;
      for (let k = 0; k < 8; k++) {
        const b = data[i++];
        size |= (b & 0x7f) << (k * 7);
        if (!(b & 0x80)) break;
      }
    }
    obus.set(type, data.subarray(i, i + size));
    i += size;
  }
  return obus;
}

const equal = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** Frame OBU -> preview blob, checking it fits the fixed headers. */
function pack(width: number, height: number, quantizer: number, obus: Map<number, Uint8Array>) {
  const seq = obus.get(1);
  const frame = obus.get(6);
  if (!seq || !frame) throw new Error('Encoder produced unexpected OBUs');
  if (!equal(seq, sequenceHeader(width, height))) {
    throw new Error('Sequence header differs from the preview profile');
  }
  const hdr = frameHeader(QINDEX[quantizer]);
  if (!equal(frame.subarray(0, hdr.length), hdr)) {
    throw new Error('Frame header differs from the preview profile');
  }
  const tile = frame.subarray(hdr.length);
  // Drop zero padding after AV1's trailing one bit (keep the one bit).
  let last = tile.length - 1;
  while (last >= 0 && !tile[last]) last--;
  if (last < 0) throw new Error('Empty tile');
  const pad = 31 - Math.clz32(tile[last] & -tile[last]);
  const tileBits = (last + 1) * 8 - pad;

  const w = new BitWriter();
  w.write(5, quantizer - QUANTIZER_MIN);
  w.write(6, width / 2 - 1);
  w.write(6, height / 2 - 1);
  for (let bit = 0; bit < tileBits; bit++) {
    w.write(1, (tile[bit >> 3] >> (7 - (bit & 7))) & 1);
  }
  const blob = w.align();
  if (blob.length !== Math.ceil((HEADER_BITS + tileBits) / 8)) throw new Error('Packing error');
  return blob;
}

async function encode(req: EncodeRequest): Promise<Uint8Array> {
  const { width, height, quantizer } = req;
  if (width % 2 || height % 2 || width < 2 || height < 2 ||
      width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`Dimensions must be even, 2..${MAX_DIMENSION}`);
  }
  if (quantizer < QUANTIZER_MIN || quantizer > 63) throw new Error('Bad quantizer');
  const M = await modulePromise;
  const { y, u, v } = toYuv444(req.rgba, width, height);
  const buf = M._malloc(y.length + u.length + v.length);
  const wiener = M.stringToNewUTF8(req.wiener);
  try {
    M.HEAPU8.set(y, buf);
    M.HEAPU8.set(u, buf + y.length);
    M.HEAPU8.set(v, buf + y.length + u.length);
    const n = M._preview_encode(buf, buf + y.length, buf + y.length + u.length,
      width, height, quantizer, req.speed, wiener);
    if (n < 0) throw new Error(M.UTF8ToString(M._preview_error()));
    const out = M.HEAPU8.slice(M._preview_output(), M._preview_output() + n);
    return pack(width, height, quantizer, splitObus(out));
  } finally {
    M._free(buf);
    M._free(wiener);
  }
}

addEventListener('message', async (event: MessageEvent<EncodeRequest>) => {
  const req = event.data;
  let res: EncodeResponse;
  try {
    res = { id: req.id, blob: await encode(req) };
  } catch (err) {
    res = { id: req.id, error: err instanceof Error ? err.message : String(err) };
  }
  postMessage(res);
});
