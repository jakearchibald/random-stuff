import type { Browsers } from '@mdn/browser-compat-data';
import type { FunctionalComponent } from 'preact';

import './styles.css';
import { browserOrder } from '../../utils/meta';

interface Props {
  browserData: Browsers;
}

const DataHeader: FunctionalComponent<Props> = ({ browserData }) => {
  return (
    <div class="data-header">
      {browserOrder.map((browser) => (
        <div class="data-header-item">
          <div class="data-header-name">{browserData[browser].name}</div>
          <div class="data-header-types">
            {['Desktop', 'Mobile'].map((type) => (
              <div class="data-header-type">{type}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DataHeader;
