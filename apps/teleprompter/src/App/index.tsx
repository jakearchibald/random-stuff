import { useComputed, useSignal } from '@preact/signals';
import { type FunctionalComponent } from 'preact';
import Prompter from './Prompter';
import './styles.css';
import { useEffect } from 'preact/hooks';

const App: FunctionalComponent = () => {
  const prompterText = useSignal('');
  const prompterMode = useSignal<'edit' | 'view'>('edit');
  const prompterLines = useComputed(() => {
    return prompterText.value
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '');
  });

  return (
    <div>
      {prompterMode.value === 'edit' ? (
        <div class="edit">
          <textarea
            class="prompter-textarea"
            value={prompterText}
            onInput={(e) => {
              prompterText.value = (e.target as HTMLTextAreaElement).value;
            }}
            placeholder="Enter your prompter text..."
          />
          <div>
            <button onClick={() => (prompterMode.value = 'view')}>
              Start Prompter
            </button>
          </div>
        </div>
      ) : (
        <Prompter lines={prompterLines.value} />
      )}
    </div>
  );
};

export default App;
