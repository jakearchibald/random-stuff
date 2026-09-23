import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import { type FloatImage, LANCZOS, loadImage, resample, toRgba } from '../encoder/image';
import {
  type Candidate,
  type EncodeOptions,
  type Progress,
  encodePreview,
} from '../encoder/search';

// The decoder is its own chunk, loaded on demand, so its size is easy to see.
const loadDecoder = () => import('../decoder');

const BLUR_PRESETS: Record<string, string> = {
  none: '0,0,0/0,0',
  light: '0,0,16/0,16',
  medium: '0,8,32/8,32',
  strong: '6,8,26/8,32',
};

// Wiener tap ranges from the AV1 spec (outer three taps; centre is implied).
const TAP_RANGES = [[-5, 10], [-23, 8], [-17, 46]];

function parseWiener(value: string): string | null {
  const m = value.replace(/\s+/g, '').match(/^(-?\d+),(-?\d+),(-?\d+)\/(-?\d+),(-?\d+)$/);
  if (!m) return null;
  const [y0, y1, y2, c1, c2] = m.slice(1).map(Number);
  const ok = (v: number, [lo, hi]: number[]) => v >= lo && v <= hi;
  if (!ok(y0, TAP_RANGES[0]) || !ok(y1, TAP_RANGES[1]) || !ok(y2, TAP_RANGES[2]) ||
      !ok(c1, TAP_RANGES[1]) || !ok(c2, TAP_RANGES[2])) return null;
  return `${y0},${y1},${y2}/${c1},${c2}`;
}

const kernelText = (t: number[]) => `[${[...t, 128 - 2 * t.reduce((a, b) => a + b, 0), ...[...t].reverse()].join(' ')}] / 128`;

function describeWiener(taps: string) {
  const [y, c] = taps.split('/').map((s) => s.split(',').map(Number));
  return `luma ${kernelText(y)}, chroma ${kernelText(c)}`;
}

const base64Length = (n: number) => Math.ceil(n / 3) * 4;

/** Display box for an image of w x h at `edge` on the long side. */
const displayBox = (w: number, h: number, edge: number) =>
  w >= h ? { width: edge, height: Math.round((h * edge) / w) } : { width: Math.round((w * edge) / h), height: edge };

function useObjectURL(blob: Uint8Array | null) {
  const url = useSignal<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    let revoked = false;
    let current: string | null = null;
    loadDecoder().then(({ toObjectURL }) => {
      if (revoked) return;
      current = toObjectURL(blob);
      url.value = current;
    });
    return () => {
      revoked = true;
      if (current) URL.revokeObjectURL(current);
      url.value = null;
    };
  }, [blob]);
  return url.value;
}

const Preview: FunctionalComponent<{ blob: Uint8Array; displaySize: number }> = ({ blob, displaySize }) => {
  const url = useObjectURL(blob);
  const info = useSignal<{ width: number; height: number; quantizer: number; avif: number } | null>(null);
  useEffect(() => {
    loadDecoder().then(({ parse, toAvif }) => {
      const p = parse(blob);
      info.value = { width: p.width, height: p.height, quantizer: p.quantizer, avif: toAvif(blob).length };
    });
  }, [blob]);
  if (!info.value) return null;
  const box = displayBox(info.value.width, info.value.height, displaySize);
  return (
    <figure>
      {url && <img src={url} width={box.width} height={box.height} alt="Preview" />}
      <figcaption>
        <strong>AVIF preview · {blob.length} bytes</strong> · {info.value.width}×{info.value.height} · quantizer{' '}
        {info.value.quantizer} · {info.value.avif} byte AVIF after conversion
      </figcaption>
    </figure>
  );
};

/** ThumbHash (https://evanw.github.io/thumbhash/) of the same source, for comparison. */
const ThumbHashPreview: FunctionalComponent<{ source: FloatImage; displaySize: number }> = ({ source, displaySize }) => {
  const result = useSignal<{ hash: Uint8Array; url: string; width: number; height: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    import('thumbhash').then(({ rgbaToThumbHash, thumbHashToDataURL, thumbHashToRGBA }) => {
      if (cancelled) return;
      // ThumbHash takes at most 100x100.
      const scale = Math.min(1, 100 / Math.max(source.width, source.height));
      const w = Math.max(1, Math.round(source.width * scale));
      const h = Math.max(1, Math.round(source.height * scale));
      const hash = rgbaToThumbHash(w, h, toRgba(resample(source, w, h, LANCZOS)));
      const decoded = thumbHashToRGBA(hash);
      result.value = { hash, url: thumbHashToDataURL(hash), width: decoded.w, height: decoded.h };
    });
    return () => {
      cancelled = true;
    };
  }, [source]);
  if (!result.value) return null;
  const { hash, url, width, height } = result.value;
  const box = displayBox(width, height, displaySize);
  const base64 = btoa(String.fromCharCode(...hash));
  return (
    <figure>
      <img src={url} width={box.width} height={box.height} alt="ThumbHash" />
      <figcaption>
        <strong>ThumbHash · {hash.length} bytes</strong> · renders at {width}×{height}
        <br />
        <code class="hash" title="Base64">{base64}</code>
      </figcaption>
    </figure>
  );
};

const DecoderSize: FunctionalComponent = () => {
  const text = useSignal('');
  useEffect(() => {
    loadDecoder().then(() => {
      // Give the resource timing entry a moment to land.
      setTimeout(() => {
        const entry = performance
          .getEntriesByType('resource')
          .find((e) => /\/decoder[-.][^/]*$|\/decoder\.ts/.test(e.name)) as PerformanceResourceTiming | undefined;
        if (!entry) return;
        const parts = [];
        if (entry.encodedBodySize) parts.push(`${entry.encodedBodySize.toLocaleString()} bytes transferred`);
        if (entry.decodedBodySize) parts.push(`${entry.decodedBodySize.toLocaleString()} bytes uncompressed`);
        text.value = `Decoder module (${entry.name.split('/').pop()}): ${parts.join(', ')}.`;
      }, 100);
    });
  }, []);
  return text.value ? <p class="note">{text.value}</p> : null;
};

const Encoder: FunctionalComponent = () => {
  const file = useSignal<File | null>(null);
  const source = useSignal<FloatImage | null>(null);
  const originalURL = useSignal<string | null>(null);

  const budget = useSignal(400);
  const autoSize = useSignal(true);
  const size = useSignal(112);
  const autoQuantizer = useSignal(true);
  const quantizer = useSignal(50);
  const blurPreset = useSignal('medium');
  const customWiener = useSignal(BLUR_PRESETS.medium);
  const speed = useSignal(0);
  const sharpen = useSignal(0);
  const displaySize = useSignal(256);

  const status = useSignal<'idle' | 'encoding' | 'done' | 'error'>('idle');
  const error = useSignal('');
  const progress = useSignal<Progress>({ done: 0, total: 0 });
  const candidates = useSignal<Candidate[]>([]);
  const selected = useSignal<Candidate | null>(null);
  const text = useSignal('');
  const copied = useSignal(false);

  const wiener = useComputed(() =>
    blurPreset.value === 'custom' ? parseWiener(customWiener.value) : BLUR_PRESETS[blurPreset.value]
  );

  // Load the chosen file.
  useSignalEffect(() => {
    const f = file.value;
    if (!f) return;
    const url = URL.createObjectURL(f);
    originalURL.value = url;
    source.value = null;
    loadImage(f).then(
      (img) => (source.value = img),
      (err) => {
        status.value = 'error';
        error.value = `Couldn't read that image: ${err.message}`;
      }
    );
    return () => URL.revokeObjectURL(url);
  });

  // (Re-)encode whenever the source or an option changes.
  useSignalEffect(() => {
    const src = source.value;
    const taps = wiener.value;
    const opts: EncodeOptions = {
      budget: budget.value,
      size: autoSize.value ? 'auto' : size.value,
      quantizer: autoQuantizer.value ? 'auto' : quantizer.value,
      wiener: taps ?? '',
      speed: speed.value,
      sharpen: sharpen.value,
      displaySize: displaySize.value,
    };
    if (!src || !taps) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      status.value = 'encoding';
      error.value = '';
      try {
        const results = await encodePreview(src, opts, (p) => (progress.value = p), controller.signal);
        candidates.value = results;
        selected.value = results[0];
        status.value = 'done';
      } catch (err) {
        if (controller.signal.aborted) return;
        status.value = 'error';
        error.value = err instanceof Error ? err.message : String(err);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  });

  useSignalEffect(() => {
    const c = selected.value;
    copied.value = false;
    if (!c) return;
    loadDecoder().then(({ toText }) => (text.value = toText(c.blob)));
  });

  const onFile = (f: File | undefined) => {
    if (f) file.value = f;
  };

  const src = source.value;
  const originalBox = src ? displayBox(src.width, src.height, displaySize.value) : null;

  return (
    <section>
      <h2>Encode</h2>
      <div
        class="drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer?.files[0]);
        }}
      >
        <label>
          Choose or drop an image:{' '}
          <input type="file" accept="image/*" onChange={(e) => onFile(e.currentTarget.files?.[0])} />
        </label>
      </div>

      <fieldset class="options">
        <legend>Options</legend>
        <label>
          <span>Byte budget</span>
          <input type="number" min={10} max={4000} step={5} value={budget}
            disabled={!autoQuantizer.value}
            onInput={(e) => (budget.value = Math.max(10, Number(e.currentTarget.value) || 400))} />
          <small>Largest file allowed; the finest quantizer that fits is used.</small>
        </label>
        <label>
          <span>Quantizer</span>
          <span class="row">
            <label class="inline">
              <input type="checkbox" checked={autoQuantizer} onChange={(e) => (autoQuantizer.value = e.currentTarget.checked)} />
              auto
            </label>
            <input type="range" min={32} max={63} value={quantizer} disabled={autoQuantizer.value}
              onInput={(e) => (quantizer.value = Number(e.currentTarget.value))} />
            <output>{autoQuantizer.value ? (selected.value?.quantizer ?? '–') : quantizer}</output>
          </span>
          <small>32 (more detail, bigger) to 63 (coarser, smaller). Stored in 5 bits.</small>
        </label>
        <label>
          <span>Size</span>
          <span class="row">
            <label class="inline">
              <input type="checkbox" checked={autoSize} onChange={(e) => (autoSize.value = e.currentTarget.checked)} />
              auto
            </label>
            <input type="range" min={8} max={128} step={2} value={size} disabled={autoSize.value}
              onInput={(e) => (size.value = Number(e.currentTarget.value))} />
            <output>{autoSize.value ? (selected.value ? `${selected.value.width}×${selected.value.height}` : '–') : `${size}px`}</output>
          </span>
          <small>Long edge of the coded image (even, up to 128). Auto tries 8–112 and picks by a preview metric.</small>
        </label>
        <label>
          <span>Blur</span>
          <select value={blurPreset} onChange={(e) => (blurPreset.value = e.currentTarget.value)}>
            <option value="none">None</option>
            <option value="light">Light</option>
            <option value="medium">Medium (default)</option>
            <option value="strong">Strong</option>
            <option value="custom">Custom taps…</option>
          </select>
          {blurPreset.value === 'custom' && (
            <input type="text" value={customWiener} spellcheck={false}
              aria-invalid={!wiener.value}
              onInput={(e) => (customWiener.value = e.currentTarget.value)} />
          )}
          <small>
            {wiener.value
              ? `AV1 Wiener loop-restoration filter baked into the file: ${describeWiener(wiener.value)}.`
              : `Format: y0,y1,y2/c1,c2 with y0 in ${TAP_RANGES[0].join('..')}, y1 and c1 in ${TAP_RANGES[1].join('..')}, y2 and c2 in ${TAP_RANGES[2].join('..')}.`}
          </small>
        </label>
        <label>
          <span>Sharpen</span>
          <span class="row">
            <input type="range" min={0} max={12} value={sharpen} onInput={(e) => (sharpen.value = Number(e.currentTarget.value))} />
            <output>{sharpen}</output>
          </span>
          <small>Back-projection iterations before encoding (0 = plain Lanczos downscale).</small>
        </label>
        <label>
          <span>Effort</span>
          <span class="row">
            <input type="range" min={0} max={4} value={4 - speed.value} onInput={(e) => (speed.value = 4 - Number(e.currentTarget.value))} />
            <output>speed {speed}</output>
          </span>
          <small>libaom speed 0 (slowest, best) to 4. Faster speeds change the sequence header, which the format fixes.</small>
        </label>
        <label>
          <span>Display size</span>
          <span class="row">
            <input type="range" min={96} max={512} step={16} value={displaySize}
              onInput={(e) => (displaySize.value = Number(e.currentTarget.value))} />
            <output>{displaySize}px</output>
          </span>
          <small>How large the preview is shown, and judged when choosing a size.</small>
        </label>
      </fieldset>

      {/* Always rendered, so progress appearing/disappearing doesn't shift the layout. */}
      <p class="status" role="status">
        {status.value === 'error' ? (
          <span class="error">{error}</span>
        ) : (
          <span class="progress" hidden={status.value !== 'encoding'}>
            Encoding… <progress max={progress.value.total} value={progress.value.done} /> {progress.value.done} encodes
          </span>
        )}
      </p>

      {src && (
        <div class="compare">
          <figure>
            {originalURL.value && <img src={originalURL.value} width={originalBox!.width} height={originalBox!.height} alt="Original" />}
            <figcaption>Original{file.value && ` · ${file.value.size.toLocaleString()} bytes`}</figcaption>
          </figure>
          {selected.value && <Preview blob={selected.value.blob} displaySize={displaySize.value} />}
          <ThumbHashPreview source={src} displaySize={displaySize.value} />
        </div>
      )}

      {selected.value && (
        <>
          <label class="block">
            <span>
              Text ({text.value.length} characters; base64 would be {base64Length(selected.value.blob.length)})
            </span>
            <textarea readOnly rows={5} value={text} onFocus={(e) => e.currentTarget.select()} />
          </label>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(text.value);
              copied.value = true;
            }}
          >
            {copied.value ? 'Copied' : 'Copy text'}
          </button>
        </>
      )}

      {candidates.value.length > 1 && (
        <details>
          <summary>All sizes tried</summary>
          <table>
            <thead>
              <tr><th /><th>Size</th><th>Quantizer</th><th>Bytes</th><th>Score</th></tr>
            </thead>
            <tbody>
              {candidates.value.map((c) => (
                <tr key={c.edge} class={c.fits ? '' : 'over'}>
                  <td>
                    <input type="radio" name="candidate" checked={c === selected.value}
                      onChange={() => (selected.value = c)} />
                  </td>
                  <td>{c.width}×{c.height}</td>
                  <td>{c.quantizer}</td>
                  <td>{c.blob.length}{c.fits ? '' : ' (over budget)'}</td>
                  <td>{c.score?.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
};

const Decoder: FunctionalComponent = () => {
  const input = useSignal('');
  const blob = useSignal<Uint8Array | null>(null);
  const error = useSignal('');
  const displaySize = useSignal(256);

  useSignalEffect(() => {
    const value = input.value.trim();
    if (!value) {
      blob.value = null;
      error.value = '';
      return;
    }
    let cancelled = false;
    loadDecoder().then(({ fromText, parse }) => {
      if (cancelled) return;
      try {
        const bytes = fromText(value);
        parse(bytes); // validate
        blob.value = bytes;
        error.value = '';
      } catch (err) {
        blob.value = null;
        error.value = err instanceof Error ? err.message : String(err);
      }
    });
    return () => {
      cancelled = true;
    };
  });

  return (
    <section>
      <h2>Decode</h2>
      <label class="block">
        <span>Paste preview text</span>
        <textarea rows={5} value={input} spellcheck={false} onInput={(e) => (input.value = e.currentTarget.value)} />
      </label>
      <label>
        Display size{' '}
        <input type="range" min={96} max={512} step={16} value={displaySize}
          onInput={(e) => (displaySize.value = Number(e.currentTarget.value))} />{' '}
        {displaySize}px
      </label>
      {error.value && <p class="error">{error}</p>}
      {blob.value && <Preview blob={blob.value} displaySize={displaySize.value} />}
      <DecoderSize />
    </section>
  );
};

const App: FunctionalComponent = () => (
  <main>
    <h1>AVIF preview</h1>
    <p>
      Tiny image previews (a few hundred bytes) that turn back into real AVIF files, so the browser decodes them
      natively. The file is just the AV1 image data (4:4:4) plus a 17-bit header; the decoder rebuilds the AV1
      headers and AVIF container around it. A blur filter is baked into the AV1 data to hide compression artifacts.
    </p>
    <Encoder />
    <Decoder />
  </main>
);

export default App;
