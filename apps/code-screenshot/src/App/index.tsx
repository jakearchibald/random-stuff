import { computed, effect, signal, useSignalEffect } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useRef } from 'preact/hooks';
import { bundledLanguagesInfo, type ThemedToken } from 'shiki';
import { isLanguage, tokenize } from '../highlighter';
import { renderCode } from '../render';
import fontURL from '../inconsolata.woff?url';

const storageKey = 'code-screenshot-settings';

interface Settings {
  code: string;
  lang: string;
  fontSize: number;
  padding: number;
  scale: number;
}

const defaults: Settings = {
  code: `function greet(name) {\n  // Say hello\n  return \`Hello, \${name}!\`;\n}\n`,
  lang: 'javascript',
  fontSize: 16,
  padding: 32,
  scale: 2,
};

function loadSettings(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey)!) };
  } catch {
    return defaults;
  }
}

const initial = loadSettings();
const code = signal(initial.code);
const lang = signal(isLanguage(initial.lang) ? initial.lang : defaults.lang);
const fontSize = signal(initial.fontSize);
const padding = signal(initial.padding);
const scale = signal(initial.scale);

effect(() => {
  const settings: Settings = {
    code: code.value,
    lang: lang.value,
    fontSize: fontSize.value,
    padding: padding.value,
    scale: scale.value,
  };
  localStorage.setItem(storageKey, JSON.stringify(settings));
});

const fontReady = signal(false);
{
  const font = new FontFace('Inconsolata', `url(${fontURL})`);
  document.fonts.add(font);
  font.load().finally(() => (fontReady.value = true));
}

// Trailing newlines would just add empty lines to the image, and tabs render
// inconsistently in canvas.
const normalizedCode = computed(() =>
  code.value.replace(/\s+$/, '').replaceAll('\t', '  '),
);

const tokens = signal<ThemedToken[][] | null>(null);
const error = signal('');
{
  let id = 0;
  effect(() => {
    const currentId = ++id;
    const source = normalizedCode.value;
    const language = lang.value;
    if (!isLanguage(language)) return;
    tokenize(source, language).then(
      (result) => {
        if (currentId !== id) return;
        tokens.value = result;
        error.value = '';
      },
      (err) => {
        if (currentId !== id) return;
        error.value = String(err);
      },
    );
  });
}

const notReady = computed(() => !tokens.value || !fontReady.value);
const status = signal('');
let statusTimeout: ReturnType<typeof setTimeout>;

function setStatus(message: string) {
  status.value = message;
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => (status.value = ''), 2000);
}

// Lets the editor overlay match the rendered output.
const editorStyle = computed(
  () => `--font-size: ${fontSize.value}px; --padding: ${padding.value}px`,
);

const languages = [...bundledLanguagesInfo].sort((a, b) =>
  a.name.localeCompare(b.name),
);

// Lets the language be typed as an id, display name, or alias.
const languageLookup = new Map<string, string>();
for (const { id, name, aliases = [] } of languages) {
  for (const key of [id, name, ...aliases]) {
    if (!languageLookup.has(key.toLowerCase())) {
      languageLookup.set(key.toLowerCase(), id);
    }
  }
}

// What's typed in the language field. `lang` only changes when this resolves
// to a known language, so the output doesn't flicker while typing.
const langInput = signal(lang.peek());
const langInputInvalid = computed(
  () => !languageLookup.has(langInput.value.trim().toLowerCase()),
);

function onLangInput(event: { currentTarget: HTMLInputElement }) {
  langInput.value = event.currentTarget.value;
  const id = languageLookup.get(langInput.value.trim().toLowerCase());
  if (id) lang.value = id;
}

const numberInput =
  (target: typeof fontSize) => (event: { currentTarget: HTMLInputElement }) => {
    const value = event.currentTarget.valueAsNumber;
    if (Number.isFinite(value)) target.value = value;
  };

const App: FunctionalComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useSignalEffect(() => {
    const canvas = canvasRef.current;
    const currentTokens = tokens.value;
    if (!canvas || !currentTokens || !fontReady.value) return;
    renderCode(canvas, {
      tokens: currentTokens,
      fontSize: fontSize.value,
      padding: padding.value,
      scale: scale.value,
    });
  });

  const toBlob = () =>
    new Promise<Blob>((resolve, reject) =>
      canvasRef.current!.toBlob(
        (blob) => (blob ? resolve(blob) : reject(Error('Encoding failed'))),
        'image/png',
      ),
    );

  const copy = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': toBlob() }),
      ]);
      setStatus('Copied');
    } catch (err) {
      setStatus(`Copy failed: ${err}`);
    }
  };

  const download = async () => {
    const url = URL.createObjectURL(await toBlob());
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div class="app">
      <form class="controls" onSubmit={(event) => event.preventDefault()}>
        <label>
          Language
          <input
            list="languages"
            autocomplete="off"
            spellcheck={false}
            value={langInput}
            onInput={onLangInput}
            // Show the canonical id once editing's done, e.g. "JS" → "javascript".
            onBlur={() => (langInput.value = lang.value)}
            aria-invalid={langInputInvalid}
          />
          <datalist id="languages">
            {languages.map((language) => (
              <option value={language.id}>{language.name}</option>
            ))}
          </datalist>
        </label>
        <label>
          Font size
          <input
            type="number"
            min={6}
            max={72}
            value={fontSize}
            onInput={numberInput(fontSize)}
          />
        </label>
        <label>
          Padding
          <input
            type="number"
            min={0}
            max={200}
            value={padding}
            onInput={numberInput(padding)}
          />
        </label>
        <label>
          Scale
          <select
            value={scale}
            onInput={(event) => (scale.value = Number(event.currentTarget.value))}
          >
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="3">3x</option>
            <option value="4">4x</option>
          </select>
        </label>
        <div class="buttons">
          <button type="button" onClick={copy} disabled={notReady}>
            Copy
          </button>
          <button type="button" onClick={download} disabled={notReady}>
            Download
          </button>
          <output>{status}</output>
        </div>
      </form>
      <output class="error">{error}</output>
      <div class="preview">
        <div class="editor" style={editorStyle}>
          <canvas ref={canvasRef} />
          <textarea
            aria-label="Code"
            spellcheck={false}
            autocapitalize="off"
            autocomplete="off"
            value={code}
            onInput={(event) => (code.value = event.currentTarget.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
