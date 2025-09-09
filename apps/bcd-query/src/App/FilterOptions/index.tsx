import type { FunctionalComponent } from 'preact';
import EngineSupportOptions, {
  type SupportOptions,
} from './EngineSupportOptions';
import type { Browsers } from '@mdn/browser-compat-data';
import VersionSupportOptions, {
  type VersionOptions,
} from './VersionSupportOptions';

export type Filter =
  | {
      type: 'engine-support';
      options: SupportOptions;
    }
  | { type: 'version-support'; options: VersionOptions };

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
    const newType = (e.currentTarget as HTMLSelectElement).value as
      | 'engine-support'
      | 'version-support';
    onChange({
      type: newType,
      options: filterDefaults[newType].options,
    } as Filter);
  };

  return (
    <div>
      <p>
        <select value={filter.type} onInput={onFilterTypeChange}>
          <option value="engine-support">Engine Support</option>
          <option value="version-support">Supported in version…</option>
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
    </div>
  );
};

export default FilterOptions;
