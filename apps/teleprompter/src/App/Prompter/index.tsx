import { type FunctionalComponent } from 'preact';
import { useSignalRef } from '@preact/signals/utils';
import './styles.css';
import { useSignal, useSignalEffect } from '@preact/signals';
import { useLayoutEffect, useRef } from 'preact/hooks';

interface PrompterProps {
  lines: string[];
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const Prompter: FunctionalComponent<PrompterProps> = ({ lines }) => {
  const container = useSignalRef<HTMLDivElement | null>(null);
  const lastEnterTime = useRef(0);
  const elapsedSeconds = useSignal(0);
  const timerStart = useSignal<number | null>(null);

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
        if (event.key === 't') {
          event.preventDefault();
          if (timerStart.value !== null) {
            // Reset to 0 and stop
            timerStart.value = null;
            elapsedSeconds.value = 0;
          } else {
            // Start from 0
            elapsedSeconds.value = 0;
            timerStart.value = Date.now();
          }
        } else if (event.key === 'PageUp') {
          event.preventDefault();
          container.value!.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        } else if (event.key === 'Enter') {
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
      { signal },
    );

    return () => {
      controller.abort();
    };
  });

  useSignalEffect(() => {
    const start = timerStart.value;
    if (start === null) return;

    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const now = Date.now();
      elapsedSeconds.value = Math.floor((now - start) / 1000);

      // Schedule the next tick for the next whole-second boundary relative
      // to `start`, correcting for any drift in when this tick actually ran.
      const nextBoundary = start + (elapsedSeconds.value + 1) * 1000;
      timeout = setTimeout(tick, nextBoundary - now);
    };
    tick();

    return () => {
      clearTimeout(timeout);
    };
  });

  return (
    <>
      <div class="prompter" ref={container}>
        {lines.map((line) => (
          <div class="prompter-line">{line}</div>
        ))}
      </div>
      {timerStart.value !== null && (
        <div class="prompter-timer">{formatTime(elapsedSeconds.value)}</div>
      )}
    </>
  );
};

export default Prompter;
