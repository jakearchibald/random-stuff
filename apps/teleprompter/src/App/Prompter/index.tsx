import { type FunctionalComponent } from 'preact';
import { useSignalRef } from '@preact/signals/utils';
import './styles.css';
import { useSignalEffect } from '@preact/signals';
import { useLayoutEffect } from 'preact/hooks';

interface PrompterProps {
  lines: string[];
}

const Prompter: FunctionalComponent<PrompterProps> = ({ lines }) => {
  const container = useSignalRef<HTMLDivElement | null>(null);

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
          container.value!.scrollBy({
            top: container.value!.clientHeight * 0.6,
            behavior: 'smooth',
          });
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
