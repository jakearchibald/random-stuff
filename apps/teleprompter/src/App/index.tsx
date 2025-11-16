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

  // For debugging
  useEffect(() => {
    prompterText.value = `
Let's talk about two phase view transitions
This is just an idea right now, which was presented by Noam Rosenthal from Google, at TPAC, the yearly W3C conference.
Here's how it works
With cross-document view transitions, you click a link, the browser goes to the network, fetches the new page, initialises it, commits it - meaning the control switches to the new document, then the transition begins
[demo]
The problem with this is, unless stuff is cached or prerendered, there can be a significant lag between clicking the link, and the transition starting
The proposal is to enable a system where the transition is split into two phases
The first part is handled by the outgoing page - it transitions to some sort of mid-point, or a skeleton state, like this example
[demo]
Then the new page performs a transition from there, to the full content
Here's how it works
In your navigate event listener, use the details to figure out what kind of page you're going to.
Then perform the appropriate animation.
You can do this however you want, but I'm going to use a view transition:
But there's a problem here - what if the navigation completes before our transition completes?
The new document take over too soon and it'd look bad
So Noam proposed a new method:
deferCommit. This potentially delays the time the new document can take over, allowing the skeleton transition to complete.
    `;
    prompterMode.value = 'view';
  }, []);

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
