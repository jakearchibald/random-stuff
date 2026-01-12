import { type FunctionalComponent } from 'preact';
import { useSignalRef } from '@preact/signals/utils';
import './styles.css';
import { useSignalEffect } from '@preact/signals';
import { useLayoutEffect, useRef } from 'preact/hooks';

interface PrompterProps {
  lines: string[];
}

const Prompter: FunctionalComponent<PrompterProps> = ({ lines }) => {
  const container = useSignalRef<HTMLDivElement | null>(null);
  const lastEnterTime = useRef(0);

  useLayoutEffect(() => {
    if (container.value) {
      container.value.scrollTop = 0;
    }
  }, []);

  useSignalEffect(() => {
    if (!container.value) return;

    const controller = new AbortController();
    const { signal } = controller;

    addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();

          const now = Date.now();
          const timeSinceLastEnter = now - lastEnterTime.current;

          // If Enter was pressed within 300ms, jump to top
          if (timeSinceLastEnter < 300) {
            container.value!.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
            lastEnterTime.current = 0; // Reset to prevent triple-press from scrolling
          } else {
            // Single press: scroll down
            container.value!.scrollBy({
              top: container.value!.clientHeight * 0.6,
              behavior: 'smooth',
            });
            lastEnterTime.current = now;
          }
        }
      },
      { signal }
    );

    return () => {
      controller.abort();
    };
  });

  return (
    <div class="prompter" ref={container}>
      {lines.map((line) => (
        <div class="prompter-line">{line}</div>
      ))}
    </div>
  );
};

export default Prompter;
