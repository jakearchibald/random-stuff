import { useSignal } from '@preact/signals';
import { type FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import PartialImage from './PartialImage';

navigator.serviceWorker.register('/apps/partial-img-decode/sw.js');

const App: FunctionalComponent = () => {
  const img = useSignal<Blob | null>(null);
  const imgId = useSignal<string>('');
  const controlled = useSignal(Boolean(navigator.serviceWorker.controller));

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
