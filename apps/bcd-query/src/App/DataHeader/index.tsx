import type { Browsers } from '@mdn/browser-compat-data';
import type { FunctionalComponent } from 'preact';

import './styles.css';
import { browserOrder } from '../../utils/meta';

interface Props {
  browserData: Browsers;
}

const DataHeader: FunctionalComponent<Props> = ({ browserData }) => {
  return (
    <thead class="data-header">
      <tr class="data-header-browsers">
        <td />
        {browserOrder.map((browser) => (
          <th class="data-header-name" colSpan={2}>
            <div class="data-header-name">{browserData[browser].name}</div>
          </th>
        ))}
      </tr>
      <tr class="data-header-types">
        <td />
        {browserOrder.map((browser) => (
          <>
            {['Desktop', 'Mobile'].map((type) => (
              <th class="data-header-type">{type}</th>
            ))}
          </>
        ))}
      </tr>
    </thead>
  );
};

export default DataHeader;
