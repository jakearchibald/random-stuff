import type { CompatData } from '@mdn/browser-compat-data';
import { type FunctionalComponent } from 'preact';
import { useComputed, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

import {
  createSimpleBCDData,
  type BCDFeatureDetails,
  type BCDSupportData,
} from '../utils/process-bcd';
import {
  filterData,
  createFilter,
  createTitleFilter,
} from '../utils/filter-data';
import DataRows from './DataRows';
import DataHeader from './DataHeader';
import { globalEvents } from '../utils/globalEvents';
import { debugMode } from './global-state';
import type { Filter } from './FilterOptions';
import FilterOptions, { filterDefaults } from './FilterOptions';

import './styles.css';
import BrowserVersions from './BrowserVersions';
import TitleFilter from './TitleFilter';

const bcdURL = 'https://unpkg.com/@mdn/browser-compat-data';
// const bcdURL = new URL('./bcd.json', import.meta.url);

const App: FunctionalComponent = () => {
  const bcdData = useSignal<CompatData | null>(null);
  const simplifiedData = useComputed(() => {
    if (!bcdData.value) return null;
    return createSimpleBCDData(bcdData.value);
  });
  const filterDef = useSignal<Filter>(filterDefaults['engine-support']);
  const titleFilter = useSignal<string>('');

  const filter = useComputed<(data: BCDFeatureDetails) => boolean>(() => {
    if (!bcdData.value) return () => false;
    return createFilter(filterDef.value, bcdData.value.browsers);
  });

  const filteredData = useComputed(() => {
    if (!simplifiedData.value) return null;
    const dataCopy = structuredClone(simplifiedData.value);
    filterData(dataCopy, filter.value);
    return dataCopy;
  });

  const titleFilterFunc = useComputed<(data: BCDFeatureDetails) => boolean>(
    () => {
      if (!bcdData.value) return () => false;
      if (!titleFilter.value.trim()) return () => true;
      return createTitleFilter(titleFilter.value);
    }
  );

  const titleFilteredData = useComputed(() => {
    if (!filteredData.value) return null;
    if (!titleFilter.value.trim()) return filteredData.value;

    const dataCopy = structuredClone(filteredData.value);
    filterData(dataCopy, titleFilterFunc.value);
    return dataCopy;
  });

  const dataError = useSignal<string | null>(null);

  useEffect(() => {
    fetch(bcdURL)
      .then((response) => response.json())
      .then((bcd: CompatData) => {
        bcdData.value = bcd;
      })
      .catch((error) => {
        dataError.value = error.message;
      });
  }, []);

  if (dataError.value) return <p>Error: {dataError.value}</p>;
  if (!titleFilteredData.value) return <p>Loading…</p>;

  const expandAllClick = () => {
    globalEvents.dispatchEvent(new Event('expandall'));
  };

  const collapseAllClick = () => {
    globalEvents.dispatchEvent(new Event('collapseall'));
  };

  const debugModeToggle = () => {
    debugMode.value = !debugMode.value;
  };

  const onFilterOptionsChange = (newValue: Filter) => {
    filterDef.value = newValue;
  };

  const onTitleFilterChange = (newValue: string) => {
    titleFilter.value = newValue;
  };

  return (
    <>
      <h1>Browser Compat Data Queries</h1>
      <h2>Browser versions</h2>
      <BrowserVersions browserData={bcdData.value!.browsers} />
      <h2>Data filters</h2>
      <FilterOptions
        browserData={bcdData.value!.browsers}
        filter={filterDef.value}
        onChange={onFilterOptionsChange}
      />
      <TitleFilter value={titleFilter.value} onChange={onTitleFilterChange} />
      <div>
        <button onClick={expandAllClick}>Expand all</button>{' '}
        <button onClick={collapseAllClick}>Collapse all</button>{' '}
        <label>
          <input
            type="checkbox"
            checked={debugMode}
            onInput={debugModeToggle}
          />{' '}
          Debug
        </label>
      </div>
      <h2>Results</h2>
      <table class="data">
        <DataHeader browserData={bcdData.value!.browsers} />
        <DataRows
          data={titleFilteredData.value.subfeatures}
          level={0}
          filter={filter}
        />
      </table>
    </>
  );
};

export default App;
