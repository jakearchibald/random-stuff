import type { FunctionalComponent } from 'preact';
import type {
  BCDFeaturePart,
  BCDSupportData,
} from '../../../utils/process-bcd';
import { Signal, useComputed, useSignal } from '@preact/signals';
import DataRows from '..';

import './styles.css';
import { asSignal } from '../../../utils/asSignal';
import { browserOrder } from '../../../utils/meta';
import { useEffect } from 'preact/hooks';
import { globalEvents } from '../../../utils/globalEvents';
import { debugMode } from '../../global-state';
import SupportBlock from './SupportBlock';

const DataRowName: FunctionalComponent<{ data: BCDFeaturePart }> = ({
  data,
}) => {
  const htmlName = data.details?.name;
  const name = htmlName ? (
    <span dangerouslySetInnerHTML={{ __html: htmlName }} />
  ) : (
    <span>{data.id}</span>
  );

  const url = data.details?.mdnURL || data.details?.specURLs[0];
  return url ? <a href={url}>{name}</a> : name;
};

export interface Props {
  data: BCDFeaturePart;
  level: number;
  filter: Signal<(data: BCDSupportData) => boolean>;
}

let pendingExpandAll = false;

const DataRow: FunctionalComponent<Props> = ({ data, level, filter }) => {
  const expand = useSignal(pendingExpandAll);
  const dataSignal = asSignal(data);
  const detailsAreInteresting = useComputed(
    () =>
      dataSignal.value.details && filter.value(dataSignal.value.details.support)
  );
  const toggleChar = useComputed(() => (expand.value ? '➖' : '➕'));

  useEffect(() => {
    const controller = new AbortController();

    globalEvents.addEventListener(
      'expandall',
      () => {
        expand.value = true;

        if (pendingExpandAll) return;

        // Bit of a hack to expand rows that are about to be created.
        pendingExpandAll = true;
        setTimeout(() => {
          pendingExpandAll = false;
        }, 0);
      },
      { signal: controller.signal }
    );

    globalEvents.addEventListener(
      'collapseall',
      () => {
        expand.value = false;
      },
      { signal: controller.signal }
    );

    return () => {
      controller.abort();
    };
  }, []);

  const onToggleClick = () => {
    expand.value = !expand.value;
  };

  const onFeatureClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a, button')) return;
    expand.value = !expand.value;
  };

  const onLogClick = () => {
    console.log(data.bcdData);
  };

  return (
    <>
      <tr class="data-row" style={{ '--level': level }}>
        <td class="data-row-feature" onClick={onFeatureClick}>
          {data.subfeatures.length === 0 ? (
            <span />
          ) : (
            <button class="data-row-toggle" onClick={onToggleClick}>
              {toggleChar}
            </button>
          )}
          {debugMode.value && (
            <button
              class="data-row-debug"
              onClick={onLogClick}
              title="Log BCD data"
            >
              🪵
            </button>
          )}
          <p class="data-row-title">
            <DataRowName data={data} />
          </p>
        </td>
        {detailsAreInteresting.value
          ? browserOrder.map((browser) => (
              <>
                {(['desktop', 'mobile'] as const).map((device) => (
                  <SupportBlock data={data.details!.support[browser][device]} />
                ))}
              </>
            ))
          : Array.from({ length: 6 }, () => (
              <td class="data-row-support-item" />
            ))}
      </tr>
      {expand.value && (
        <DataRows data={data.subfeatures} level={level + 1} filter={filter} />
      )}
    </>
  );
};

export default DataRow;
