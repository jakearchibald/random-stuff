import type { FunctionalComponent } from 'preact';
import type {
  BCDFeaturePart,
  BCDBrowser,
  BCDSupportData,
} from '../../../utils/process-bcd';
import { Signal, useComputed, useSignal } from '@preact/signals';
import DataRows from '..';

import './styles.css';
import { classes } from '../../../utils/classes';
import { asSignal } from '../../../utils/asSignal';
import { browserOrder } from '../../../utils/meta';
import { useEffect } from 'preact/hooks';
import { globalEvents } from '../../../utils/globalEvents';

const DataRowName: FunctionalComponent<{ data: BCDFeaturePart }> = ({
  data,
}) => {
  const htmlName = data.details?.name;
  const mdnURL = data.details?.mdnURL;
  const name = htmlName ? (
    <span dangerouslySetInnerHTML={{ __html: htmlName }} />
  ) : (
    <span>{data.id}</span>
  );

  if (mdnURL) {
    return <a href={mdnURL}>{name}</a>;
  }

  return name;
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

  const onRowClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a, button')) return;
    expand.value = !expand.value;
  };

  return (
    <>
      <tr class="data-row" onClick={onRowClick} style={{ '--level': level }}>
        <td class="data-row-feature">
          {data.subfeatures.length === 0 ? (
            <span />
          ) : (
            <button class="data-row-toggle" onClick={onToggleClick}>
              {toggleChar}
            </button>
          )}
          <p class="data-row-title">
            <DataRowName data={data} />
          </p>
        </td>
        {detailsAreInteresting.value &&
          browserOrder.map((browser) => (
            <>
              <td
                class={classes({
                  'data-row-support-item': true,
                  supported: Boolean(data.details!.support[browser].desktop),
                })}
              >
                {data.details!.support[browser].desktop}
              </td>
              <td
                class={classes({
                  'data-row-support-item': true,
                  supported: Boolean(data.details!.support[browser].mobile),
                })}
              >
                {data.details!.support[browser].mobile}
              </td>
            </>
          ))}
      </tr>
      {expand.value && (
        <DataRows data={data.subfeatures} level={level + 1} filter={filter} />
      )}
    </>
  );
};

export default DataRow;
