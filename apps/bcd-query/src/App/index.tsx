import type { CompatData } from '@mdn/browser-compat-data';
import { type FunctionalComponent } from 'preact';
import { useComputed, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

import { createSimpleBCDData, type BCDSupportData } from '../utils/process-bcd';
import {
  filterData,
  onlyMissingInFirefox,
  missingInFirefox,
} from '../utils/filter-data';
import DataRows from './DataRows';
import DataHeader from './DataHeader';

import './styles.css';
import { globalEvents } from '../utils/globalEvents';

const bcdURL = 'https://unpkg.com/@mdn/browser-compat-data';

const App: FunctionalComponent = () => {
  const bcdData = useSignal<CompatData | null>(null);
  const simplifiedData = useComputed(() => {
    if (!bcdData.value) return null;
    return createSimpleBCDData(bcdData.value);
  });
  const filter =
    useSignal<(data: BCDSupportData) => boolean>(onlyMissingInFirefox);
  const filteredData = useComputed(() => {
    if (!simplifiedData.value) return null;
    const dataCopy = structuredClone(simplifiedData.value);
    filterData(dataCopy, filter.value);
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
  if (!filteredData.value) return <p>Loading…</p>;

  const expandAllClick = () => {
    globalEvents.dispatchEvent(new Event('expandall'));
  };

  const collapseAllClick = () => {
    globalEvents.dispatchEvent(new Event('collapseall'));
  };

  return (
    <>
      <div>
        <button onClick={expandAllClick}>Expand all</button>{' '}
        <button onClick={collapseAllClick}>Collapse all</button>
      </div>
      <table class="data">
        <DataHeader browserData={bcdData.value!.browsers} />
        <DataRows
          data={filteredData.value.subfeatures}
          level={0}
          filter={filter}
        />
      </table>
    </>
  );
};

export default App;
