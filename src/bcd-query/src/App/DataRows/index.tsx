import type { FunctionalComponent } from 'preact';
import type { BCDFeaturePart, BCDSupportData } from '../../utils/process-bcd';
import DataRow from './DataRow';

import './styles.css';
import type { Signal } from '@preact/signals';

export interface Props {
  data: BCDFeaturePart[];
  level: number;
  filter: Signal<(data: BCDSupportData) => boolean>;
}

const DataRows: FunctionalComponent<Props> = ({ data, level, filter }) => {
  return (
    <div class="data-rows" style={{ '--level': level }}>
      {data.map((item) => (
        <DataRow key={item.id} data={item} level={level} filter={filter} />
      ))}
    </div>
  );
};

export default DataRows;
