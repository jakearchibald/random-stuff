import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { type FunctionalComponent } from 'preact';
import { useRef } from 'preact/hooks';
import './styles.css';

interface Props {
  imageId: string;
  maxSize: number;
  density: number;
}

const PartialImage: FunctionalComponent<Props> = ({
  imageId,
  maxSize,
  density,
}) => {
  const bytes = useSignal(1);
  const percent = useComputed(() => Math.round((bytes.value / maxSize) * 100));
  const debouncedBytes = useSignal(1);
  const timeoutRef = useRef(0);

  const imgURL = useComputed(() => {
    const url = new URL('/apps/partial-img-decode/img', location.href);
    url.searchParams.set('id', imageId);
    url.searchParams.set('length', debouncedBytes.value.toString());
    // Cache busting
    url.searchParams.set('t', Date.now().toString());
    return url.toString();
  });

  useSignalEffect(() => {
    const newBytes = bytes.value;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      debouncedBytes.value = newBytes;
    }, 300);
  });

  const terminate = (errorStream: boolean) => {
    navigator.serviceWorker.controller?.postMessage({
      action: 'terminate-img',
      id: imageId,
      errorStream,
    });
  };

  return (
    <div>
      <p class="progress">
        Bytes: {bytes} / {maxSize} ({percent}%)
      </p>
      <div class="slider-container">
        <input
          type="range"
          min="1"
          max={maxSize}
          value={bytes.value}
          onInput={(e) =>
            (bytes.value = (e.target as HTMLInputElement).valueAsNumber)
          }
        />
      </div>
      <p>
        <button type="button" onClick={() => terminate(false)}>
          End request
        </button>{' '}
        <button type="button" onClick={() => terminate(true)}>
          Fail request
        </button>
      </p>
      <img
        class="partial-img"
        srcset={`${imgURL} ${density}x`}
        alt="Partial image"
        key={debouncedBytes.value}
      />
    </div>
  );
};

export default PartialImage;
