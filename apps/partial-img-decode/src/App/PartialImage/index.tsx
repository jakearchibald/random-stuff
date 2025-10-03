import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { type FunctionalComponent } from 'preact';
import { useRef } from 'preact/hooks';
import './styles.css';

interface Props {
  imageId: string;
  maxSize: number;
}

const PartialImage: FunctionalComponent<Props> = ({ imageId, maxSize }) => {
  const bytes = useSignal(1);
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

  return (
    <div>
      <p>
        Bytes: {bytes} / {maxSize}
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
      <img
        class="partial-img"
        src={imgURL}
        alt="Partial image"
        key={debouncedBytes.value}
      />
    </div>
  );
};

export default PartialImage;
