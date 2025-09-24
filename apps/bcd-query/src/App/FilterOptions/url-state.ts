import { useMemo } from 'preact/hooks';
import { useSignal, useSignalEffect } from '@preact/signals';
import type { Filter } from './index';
import { filterDefaults } from './index';

function isFilterType(value: string | null): value is Filter['type'] {
  return Boolean(value && value in filterDefaults);
}

function useInitialState() {
  return useMemo(() => {
    const params = new URLSearchParams(location.search);

    const initialFilterDef: Filter = (() => {
      const filterType = params.get('filterType');

      if (!isFilterType(filterType)) {
        return filterDefaults['engine-support'];
      }

      const filter = filterDefaults[filterType];

      // For engine-support, read individual browser options from URL
      if (filterType === 'engine-support' && filter.type === 'engine-support') {
        const chrome = params.get('chrome') as
          | 'supported'
          | 'unsupported'
          | null;
        const firefox = params.get('firefox') as
          | 'supported'
          | 'unsupported'
          | null;
        const safari = params.get('safari') as
          | 'supported'
          | 'unsupported'
          | null;

        return {
          type: 'engine-support',
          options: {
            chrome: chrome || filter.options.chrome,
            firefox: firefox || filter.options.firefox,
            safari: safari || filter.options.safari,
          },
        };
      }

      // For version-support, read browser and version from URL
      if (
        filterType === 'version-support' &&
        filter.type === 'version-support'
      ) {
        const browser =
          (params.get('browser') as any) || filter.options.browser;
        const version = params.get('version') || filter.options.version;

        return {
          type: 'version-support',
          options: { browser, version },
        };
      }

      return filter;
    })();

    return {
      initialFilterDef,
      initialTitleFilter: params.get('title') || '',
    };
  }, []);
}

export function useFilterURLState() {
  // Initialize from URL query parameters
  const initialState = useInitialState();

  const filterDef = useSignal<Filter>(initialState.initialFilterDef);
  const titleFilter = useSignal<string>(initialState.initialTitleFilter);

  // Update URL when filters change
  useSignalEffect(() => {
    const params = new URLSearchParams();

    // Add filter type and specific options
    params.set('filterType', filterDef.value.type);

    if (filterDef.value.type === 'engine-support') {
      params.set('chrome', filterDef.value.options.chrome);
      params.set('firefox', filterDef.value.options.firefox);
      params.set('safari', filterDef.value.options.safari);
    } else if (filterDef.value.type === 'version-support') {
      params.set('browser', filterDef.value.options.browser);
      params.set('version', filterDef.value.options.version);
    }

    // Add title filter if not empty
    if (titleFilter.value.trim()) {
      params.set('title', titleFilter.value);
    }

    // Update URL without page reload
    const newURL = `?${params.toString()}`;
    history.replaceState(null, '', newURL);
  });

  return {
    filterDef,
    titleFilter,
  };
}
