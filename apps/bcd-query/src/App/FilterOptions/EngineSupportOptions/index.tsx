import type { FunctionalComponent } from 'preact';
import type { Browsers } from '@mdn/browser-compat-data/types';
import { useRef } from 'preact/hooks';

import { browserOrder } from '../../../utils/meta';
import type { BCDBrowser } from '../../../utils/process-bcd';

import './styles.css';

interface Props {
  browserData: Browsers;
  value: SupportOptions;
  onChange: (newValue: SupportOptions) => void;
}

export type SupportOptions = Record<
  BCDBrowser,
  'supported' | 'unsupported' | 'either'
>;

const EngineSupportOptions: FunctionalComponent<Props> = ({
  browserData,
  value,
  onChange,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const onInput = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const newValues: SupportOptions = {} as SupportOptions;
    for (const [key, value] of formData.entries()) {
      newValues[key as BCDBrowser] = value as SupportOptions[BCDBrowser];
    }
    onChange(newValues);
  };

  return (
    <form class="engine-filter" ref={formRef} onInput={onInput}>
      {browserOrder.map((browser) => (
        <div class="engine-filter-row">
          <div class="engine-filter-name">{browserData[browser].name}:</div>
          <label>
            <input
              type="radio"
              name={browser}
              value="supported"
              checked={value[browser] === 'supported'}
            />{' '}
            Supported
          </label>
          <label>
            <input
              type="radio"
              name={browser}
              value="unsupported"
              checked={value[browser] === 'unsupported'}
            />{' '}
            Unsupported
          </label>
          <label>
            <input
              type="radio"
              name={browser}
              value="either"
              checked={value[browser] === 'either'}
            />{' '}
            Either
          </label>
        </div>
      ))}
    </form>
  );
};

export default EngineSupportOptions;
