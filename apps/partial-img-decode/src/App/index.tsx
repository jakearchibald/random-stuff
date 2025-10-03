import { useSignal } from '@preact/signals';
import { type FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import PartialImage from './PartialImage';

const demoModules = import.meta.glob('./demos/*.*', {
  query: '?url',
  eager: true,
});
const demos: Record<string, string> = {};

for (const path in demoModules) {
  const match = path.match(/\/([^/]+)+$/);
  if (match) {
    const demoName = match[1];
    demos[demoName] = (demoModules[path] as { default: string }).default;
  }
}

navigator.serviceWorker.register('/apps/partial-img-decode/sw.js');

const url = new URL(location.href);
const demoParam = url.searchParams.get('demo');

const App: FunctionalComponent = () => {
  const img = useSignal<Blob | null>(null);
  const imgId = useSignal<string>('');
  const controlled = useSignal(Boolean(navigator.serviceWorker.controller));
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
        imgId.value = crypto.randomUUID();
        loadingDemoState.value = '';
      } catch (error) {
        console.error(error);
        loadingDemoState.value = 'failed';
      }
    })();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    navigator.serviceWorker.addEventListener(
      'message',
      (event) => {
        if (event.data.action === 'provide-img') {
          const { id } = event.data;
          event.source!.postMessage({
            action: 'img-blob',
            id,
            blob: img.value,
          });
        }
      },
      { signal: controller.signal }
    );

    navigator.serviceWorker.startMessages();

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        controlled.value = Boolean(navigator.serviceWorker.controller);
      },
      { signal: controller.signal }
    );

    return () => {
      controller.abort();
    };
  }, []);

  if (loadingDemoState.value === 'loading') {
    return <p>Loading demo image…</p>;
  }

  if (loadingDemoState.value === 'failed') {
    return <p>Failed to load demo image.</p>;
  }

  if (!img.value) {
    return (
      <label>
        Pick image file:{' '}
        <input
          type="file"
          onInput={(event) => {
            const fileInput = event.currentTarget as HTMLInputElement;
            if (fileInput.files && fileInput.files.length > 0) {
              img.value = fileInput.files[0];
              imgId.value = crypto.randomUUID();
            }
          }}
        />
      </label>
    );
  }

  if (!controlled.value) {
    return <p>Waiting for service worker…</p>;
  }

  return <PartialImage imageId={imgId.value} maxSize={img.value.size} />;
};

export default App;
