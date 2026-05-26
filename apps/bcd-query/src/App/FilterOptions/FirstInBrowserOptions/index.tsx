import type { FunctionalComponent } from 'preact';
import type { Browsers } from '@mdn/browser-compat-data/types';

import { browserOrder } from '../../../utils/meta';
import type { BCDBrowser } from '../../../utils/process-bcd';

interface Props {
  browserData: Browsers;
  value: FirstInBrowserOptions;
  onChange: (newValue: FirstInBrowserOptions) => void;
}

export interface FirstInBrowserOptions {
  browser: BCDBrowser;
  after: string;
}

const FirstInBrowserOptionsComp: FunctionalComponent<Props> = ({
  browserData,
  value,
  onChange,
}) => {
  const onBrowserChange = (e: Event) => {
    const browser = (e.currentTarget as HTMLSelectElement).value as BCDBrowser;
    onChange({ ...value, browser });
  };

  const onAfterChange = (e: Event) => {
    const after = (e.currentTarget as HTMLInputElement).value;
    onChange({ ...value, after });
  };

  return (
    <p>
      <label>
        Browser:{' '}
        <select value={value.browser} onInput={onBrowserChange}>
          {browserOrder.map((browser) => (
            <option key={browser} value={browser}>
              {browserData[browser].name}
            </option>
          ))}
        </select>
      </label>{' '}
      <label>
        After:{' '}
        <input type="date" value={value.after} onInput={onAfterChange} />
      </label>
    </p>
  );
};

export default FirstInBrowserOptionsComp;
