// AVIF preview decoder: turns a preview blob (or its text form) into a real
// AVIF file the browser decodes natively. No wasm and no canvas: it rebuilds
// the AV1 sequence header, frame header and ISOBMFF container that the
// encoder stripped out, around the entropy-coded tile data.
//
// Blob layout (bits, MSB first):
//   [quantizer - 32: 5][width/2 - 1: 6][height/2 - 1: 6]
//   [AV1 tile data up to and including its trailing one bit][zero padding]
// The image is always 8-bit 4:4:4 (AV1 High profile), BT.601 full range.

/** libaom's quantizer (0..63) to AV1 base_q_idx. */
export const QINDEX = [
  0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76,
  80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140,
  144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200,
  204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 249, 255,
];
export const QUANTIZER_MIN = 32;
export const MAX_DIMENSION = 128;
export const HEADER_BITS = 17;

export class BitWriter {
  #bytes: number[] = [];
  #cur = 0;
  #n = 0;

  get bitLength() {
    return this.#bytes.length * 8 + this.#n;
  }

  write(bits: number, value: number) {
    for (let i = bits - 1; i >= 0; i--) {
      this.#cur = (this.#cur << 1) | ((value >>> i) & 1);
      if (++this.#n === 8) {
        this.#bytes.push(this.#cur);
        this.#cur = 0;
        this.#n = 0;
      }
    }
  }

  /** Zero-pad to a byte boundary and return the bytes. */
  align(): Uint8Array {
    while (this.#n) this.write(1, 0);
    return Uint8Array.from(this.#bytes);
  }
}

const bitsFor = (v: number) => {
  let n = 1;
  while (v >= 1 << n) n++;
  return n;
};

/** AV1 sequence header OBU payload: everything but the size is fixed. */
export function sequenceHeader(width: number, height: number): Uint8Array {
  const w = new BitWriter();
  w.write(3, 1); // seq_profile = High (needed for 4:4:4)
  w.write(1, 1); // still_picture
  w.write(1, 1); // reduced_still_picture_header
  w.write(5, 0); // seq_level_idx = 2.0
  const wb = bitsFor(width - 1);
  const hb = bitsFor(height - 1);
  w.write(4, wb - 1);
  w.write(4, hb - 1);
  w.write(wb, width - 1);
  w.write(hb, height - 1);
  w.write(1, 1); // use_128x128_superblock
  w.write(1, 1); // enable_filter_intra
  w.write(1, 1); // enable_intra_edge_filter
  w.write(1, 0); // enable_superres
  w.write(1, 0); // enable_cdef
  w.write(1, 1); // enable_restoration
  w.write(1, 0); // high_bitdepth
  w.write(1, 1); // color_description_present_flag
  w.write(8, 1); // color_primaries: BT.709
  w.write(8, 13); // transfer_characteristics: sRGB
  w.write(8, 6); // matrix_coefficients: BT.601
  w.write(1, 1); // color_range: full (profile 1: no subsampling, no chroma position)
  w.write(1, 0); // separate_uv_delta_q
  w.write(1, 0); // film_grain_params_present
  w.write(1, 1); // trailing_one_bit
  return w.align();
}

/**
 * AV1 uncompressed frame header (spec 5.9) for a reduced-still-picture key
 * frame of at most one superblock. The encoder pins every field except
 * base_q_idx: no loop filter, Wiener loop restoration on all planes in one
 * 256px unit (the coefficients, i.e. the blur, live in the tile data).
 */
export function frameHeader(qindex: number): Uint8Array {
  const w = new BitWriter();
  w.write(1, 0); // disable_cdf_update
  w.write(1, 0); // allow_screen_content_tools
  w.write(1, 0); // render_and_frame_size_different
  w.write(1, 1); // uniform_tile_spacing_flag
  w.write(8, qindex); // base_q_idx
  w.write(3, 0); // DeltaQYDc, DeltaQUDc, DeltaQUAc not coded
  w.write(1, 0); // using_qmatrix
  w.write(1, 0); // segmentation_enabled
  w.write(1, 0); // delta_q_present
  w.write(12, 0); // loop_filter_level[0..1] = 0 (so no U/V levels)
  w.write(3, 0); // loop_filter_sharpness
  w.write(1, 1); // loop_filter_delta_enabled
  w.write(1, 0); // loop_filter_delta_update
  w.write(6, 0b101010); // lr_type = WIENER for Y, U, V
  w.write(1, 1); // lr_unit_shift: 256px units (no lr_uv_shift: 4:4:4)
  w.write(1, 1); // tx_mode_select
  w.write(1, 0); // reduced_tx_set
  return w.align();
}

export interface Preview {
  width: number;
  height: number;
  quantizer: number;
  /** AV1 frame OBU payload: frame header + tile data. */
  frame: Uint8Array;
}

/** Unpack a preview blob. */
export function parse(blob: Uint8Array): Preview {
  if (blob.length < 3) throw new Error('Preview data is too short');
  const head = (blob[0] << 9) | (blob[1] << 1) | (blob[2] >> 7);
  const quantizer = QUANTIZER_MIN + (head >> 12);
  const width = ((head >> 6) & 63) * 2 + 2;
  const height = (head & 63) * 2 + 2;
  // The blob's last set bit is AV1's trailing bit: the tile ends there.
  let last = blob.length - 1;
  while (last >= 0 && !blob[last]) last--;
  const pad = last >= 0 ? 31 - Math.clz32(blob[last] & -blob[last]) : 0;
  const tileBits = (last + 1) * 8 - pad - HEADER_BITS;
  if (tileBits < 1) throw new Error('Preview data has no image data');
  const tile = new Uint8Array((tileBits + 7) >> 3);
  for (let k = 0; k < tile.length; k++) {
    // Shift left by 17 bits (2 bytes + 1 bit).
    tile[k] = ((blob[2 + k] << 1) | ((blob[3 + k] ?? 0) >> 7)) & 0xff;
  }
  const hdr = frameHeader(QINDEX[quantizer]);
  const frame = new Uint8Array(hdr.length + tile.length);
  frame.set(hdr);
  frame.set(tile, hdr.length);
  return { width, height, quantizer, frame };
}

// ------------------------------------------------------------------ ISOBMFF

const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const u8 = (...v: number[]) => Uint8Array.from(v);
const u16 = (v: number) => u8((v >> 8) & 255, v & 255);
const u32 = (v: number) =>
  u8((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
const str = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const box = (type: string, ...payload: Uint8Array[]) => {
  const body = concat(...payload);
  return concat(u32(8 + body.length), str(type), body);
};
const fullBox = (type: string, version: number, ...payload: Uint8Array[]) =>
  box(type, u8(version, 0, 0, 0), ...payload);
const leb128 = (v: number) => {
  const out: number[] = [];
  do {
    const b = v & 0x7f;
    v >>>= 7;
    out.push(v ? b | 0x80 : b);
  } while (v);
  return Uint8Array.from(out);
};

/** Build a minimal, spec-valid AVIF file around an AV1 frame OBU. */
export function buildAvif(
  width: number,
  height: number,
  frame: Uint8Array
): Uint8Array {
  const seq = sequenceHeader(width, height);
  const mdatPayload = concat(
    u8(0x12, 0x00), // temporal delimiter OBU
    u8(0x0a), leb128(seq.length), seq, // sequence header OBU
    u8(0x32), leb128(frame.length), frame // frame OBU
  );
  // MA1A (AVIF Advanced): 4:4:4 needs AV1 High profile, which Baseline excludes.
  const ftyp = box('ftyp', str('avif'), u32(0), str('avifmif1miafMA1A'));
  const hdlr = fullBox('hdlr', 0, u32(0), str('pict'), new Uint8Array(13));
  const pitm = fullBox('pitm', 0, u16(1));
  const iloc = (offset: number) =>
    fullBox('iloc', 0, u8(0x44, 0x00), u16(1), u16(1), u16(0), u16(1),
      u32(offset), u32(mdatPayload.length));
  const infe = fullBox('infe', 2, u16(1), u16(0), str('av01Color\0'));
  const iinf = fullBox('iinf', 0, u16(1), infe);
  const ispe = fullBox('ispe', 0, u32(width), u32(height));
  const pixi = fullBox('pixi', 0, u8(3, 8, 8, 8));
  const av1C = box('av1C', u8(0x81, 0x20, 0x00, 0x00)); // High profile, 8-bit 4:4:4
  const colr = box('colr', str('nclx'), u16(1), u16(13), u16(6), u8(0x80));
  const ipco = box('ipco', ispe, pixi, av1C, colr);
  // item 1 -> ispe, pixi, av1C (essential), colr
  const ipma = fullBox('ipma', 0, u32(1), u16(1), u8(4, 0x01, 0x02, 0x83, 0x04));
  const iprp = box('iprp', ipco, ipma);
  const head = concat(hdlr, pitm);
  const tail = concat(iinf, iprp);
  const metaLength = 12 + head.length + iloc(0).length + tail.length;
  const meta = fullBox('meta', 0, head, iloc(ftyp.length + metaLength + 8), tail);
  return concat(ftyp, meta, box('mdat', mdatPayload));
}

/** Preview blob -> AVIF file bytes. */
export function toAvif(blob: Uint8Array): Uint8Array {
  const { width, height, frame } = parse(blob);
  return buildAvif(width, height, frame);
}

/** Preview blob -> object URL for an <img>. Revoke it when done. */
export function toObjectURL(blob: Uint8Array): string {
  return URL.createObjectURL(
    new Blob([toAvif(blob) as Uint8Array<ArrayBuffer>], { type: 'image/avif' })
  );
}

// ------------------------------------------------------------------ text

// Printable ASCII minus characters that need escaping in HTML attributes,
// JSON strings, JS string/template literals: space " ' ` \ < > & $
const ALPHABET =
  '!#%()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~';
const BASE = ALPHABET.length; // 86
const DIGIT = new Map([...ALPHABET].map((c, i) => [c, i]));

/**
 * Bytes -> text: base-86, 4 bytes per 5 characters (a trailing group of
 * n bytes takes n + 1 characters). 6.4 bits per character vs base64's 6.
 */
export function toText(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 4) {
    const n = Math.min(4, bytes.length - i);
    let v = 0;
    for (let k = 0; k < 4; k++) v = v * 256 + (k < n ? bytes[i + k] : 0);
    const digits: string[] = [];
    for (let k = 0; k < 5; k++) {
      digits.push(ALPHABET[v % BASE]);
      v = Math.floor(v / BASE);
    }
    out += digits.reverse().join('').slice(0, n + 1);
  }
  return out;
}

/** Text -> bytes. Whitespace is ignored. */
export function fromText(text: string): Uint8Array {
  const chars = text.replace(/\s+/g, '');
  if (chars.length % 5 === 1) throw new Error('Invalid preview text (bad length)');
  const out: number[] = [];
  for (let i = 0; i < chars.length; i += 5) {
    const group = chars.slice(i, i + 5);
    const n = group.length - 1; // bytes in this group
    let v = 0;
    for (let k = 0; k < 5; k++) {
      const d = k < group.length ? DIGIT.get(group[k]) : BASE - 1;
      if (d === undefined) {
        throw new Error(`Invalid character in preview text: ${JSON.stringify(group[k])}`);
      }
      v = v * BASE + d;
    }
    if (n === 4 && v > 0xffffffff) throw new Error('Invalid preview text (overflow)');
    for (let k = 3; k >= 4 - n; k--) out.push(Math.floor(v / 256 ** k) % 256);
  }
  return Uint8Array.from(out);
}
