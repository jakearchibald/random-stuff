import type { FunctionalComponent } from 'preact';
import EngineSupportOptions, {
  type SupportOptions,
} from './EngineSupportOptions';
import type { Browsers } from '@mdn/browser-compat-data';
import VersionSupportOptions, {
  type VersionOptions,
} from './VersionSupportOptions';
import FirstInBrowserOptionsComp, {
  type FirstInBrowserOptions,
} from './FirstInBrowserOptions';

export type Filter =
  | {
      type: 'engine-support';
      options: SupportOptions;
    }
  | { type: 'version-support'; options: VersionOptions }
  | { type: 'first-in-browser'; options: FirstInBrowserOptions }
  | { type: 'approaching-baseline' }
  | { type: 'newly-baseline' };

export const filterDefaults: Record<Filter['type'], Filter> = {
  'engine-support': {
    type: 'engine-support',
    options: {
      chrome: 'supported',
      firefox: 'unsupported',
      safari: 'supported',
    },
  },
  'version-support': {
    type: 'version-support',
    options: {
      browser: 'firefox',
      version: '142',
    },
  },
  'first-in-browser': {
    type: 'first-in-browser',
    options: {
      browser: 'firefox',
      after: '',
    },
  },
  'approaching-baseline': { type: 'approaching-baseline' },
  'newly-baseline': { type: 'newly-baseline' },
};

interface Props {
  filter: Filter;
  browserData: Browsers;
  onChange: (newValue: Filter) => void;
}

const FilterOptions: FunctionalComponent<Props> = ({
  filter,
  browserData,
  onChange,
}) => {
  const onFilterTypeChange = (e: Event) => {
    const newType = (e.currentTarget as HTMLSelectElement)
      .value as Filter['type'];

    onChange(filterDefaults[newType]);
  };

  return (
    <div>
      <p>
        <select value={filter.type} onInput={onFilterTypeChange}>
          <option value="engine-support">Engine Support</option>
          <option value="version-support">Added in version…</option>
          <option value="first-in-browser">First in browser</option>
          <option value="approaching-baseline">Approaching baseline?</option>
          <option value="newly-baseline">Newly baseline</option>
        </select>
      </p>
      {filter.type === 'version-support' && (
        <VersionSupportOptions
          browserData={browserData}
          value={filter.options}
          onChange={(newValue) =>
            onChange({ type: 'version-support', options: newValue })
          }
        />
      )}
      {filter.type === 'engine-support' && (
        <EngineSupportOptions
          browserData={browserData}
          value={filter.options}
          onChange={(newValue) =>
            onChange({ type: 'engine-support', options: newValue })
          }
        />
      )}
      {filter.type === 'first-in-browser' && (
        <FirstInBrowserOptionsComp
          browserData={browserData}
          value={filter.options}
          onChange={(newValue) =>
            onChange({ type: 'first-in-browser', options: newValue })
          }
        />
      )}
    </div>
  );
};

export default FilterOptions;
