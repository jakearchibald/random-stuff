import { useSignal } from '@preact/signals';
import { type FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import BenchDecode from './BenchDecode';

const demoModules = import.meta.glob(
  '../../../partial-img-decode/src/App/demos/*.*',
  {
    query: '?url',
    eager: true,
  }
);
const demos: Record<string, string> = {};

for (const path in demoModules) {
  const match = path.match(/\/([^/]+)+$/);
  if (match) {
    const demoName = match[1];
    demos[demoName] = (demoModules[path] as { default: string }).default;
  }
}

const url = new URL(location.href);
const demoParam = url.searchParams.get('demo');

const App: FunctionalComponent = () => {
  const benchDecodeKey = useSignal(0);
  const img = useSignal<Blob | null>(null);
  const loadingDemoState = useSignal<'loading' | 'failed' | ''>(
    demoParam ? 'loading' : ''
  );

  useEffect(() => {
    if (!demoParam) return;
    const demoURL = demos[demoParam];
    if (!demoURL) {
      console.error(new Error(`Demo not found: ${demoParam}`));
      loadingDemoState.value = 'failed';
      return;
    }

    (async () => {
      try {
        const response = await fetch(demoURL);
        if (!response.ok) {
          throw new Error(`Failed to load demo image: ${response.status}`);
        }
        const blob = await response.blob();
        img.value = blob;
        loadingDemoState.value = '';
      } catch (error) {
        console.error(error);
        loadingDemoState.value = 'failed';
      }
    })();
  }, []);

  if (loadingDemoState.value === 'loading') {
    return <p>Loading demo image…</p>;
  }

  if (loadingDemoState.value === 'failed') {
    return <p>Failed to load demo image.</p>;
  }

  if (!img.value) {
    return (
      <div>
        <label>
          Pick image file:{' '}
          <input
            type="file"
            onInput={(event) => {
              const fileInput = event.currentTarget as HTMLInputElement;
              if (fileInput.files && fileInput.files.length > 0) {
                img.value = fileInput.files[0];
              }
            }}
          />
        </label>
        <p>Or try one of these demos:</p>
        <ul>
          {Object.keys(demos).map((demoName) => (
            <li key={demoName}>
              <a href={`?demo=${demoName}`}>{demoName}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <BenchDecode
      key={benchDecodeKey.value}
      img={img.value}
      onAgain={() => benchDecodeKey.value++}
    />
  );
};

export default App;
