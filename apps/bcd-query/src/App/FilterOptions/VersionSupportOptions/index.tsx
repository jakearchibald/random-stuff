import type { FunctionalComponent } from 'preact';
import type { Browsers } from '@mdn/browser-compat-data/types';
import { useRef } from 'preact/hooks';

import { browserOrder } from '../../../utils/meta';
import type { BCDBrowser } from '../../../utils/process-bcd';

import './styles.css';

interface Props {
  browserData: Browsers;
  value: VersionOptions;
  onChange: (newValue: VersionOptions) => void;
}

export interface VersionOptions {
  browser: BCDBrowser;
  version: string;
}

const VersionSupportOptions: FunctionalComponent<Props> = ({
  browserData,
  value,
  onChange,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const onVersionChange = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const newValues: VersionOptions = {
      browser: formData.get('browser') as BCDBrowser,
      version: formData.get('version') as string,
    };
    onChange(newValues);
  };

  const onBrowserChange = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const browser = formData.get('browser') as BCDBrowser;
    const newValues: VersionOptions = {
      browser,
      version:
        Object.entries(browserData[browser].releases)
          .reverse()
          .find(([_, release]) => release.status === 'current')?.[0] || '',
    };
    onChange(newValues);
  };

  return (
    <form ref={formRef}>
      <p>
        <label>
          Browser:{' '}
          <select
            name="browser"
            value={value.browser}
            onInput={onBrowserChange}
          >
            {browserOrder.map((browser) => (
              <option key={browser} value={browser}>
                {browserData[browser].name}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Version:{' '}
          <select
            name="version"
            value={value.version}
            onInput={onVersionChange}
          >
            {Object.entries(browserData[value.browser].releases).map(
              ([version, release]) => (
                <option key={version} value={version}>
                  {version} ({release.status})
                </option>
              )
            )}
          </select>
        </label>
      </p>
    </form>
  );
};

export default VersionSupportOptions;
