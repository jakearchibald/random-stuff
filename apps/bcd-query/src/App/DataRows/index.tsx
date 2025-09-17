import type { FunctionalComponent } from 'preact';
import type {
  BCDFeatureDetails,
  BCDFeaturePart,
} from '../../utils/process-bcd';
import DataRow from './DataRow';

import './styles.css';
import type { Signal } from '@preact/signals';

export interface Props {
  data: BCDFeaturePart[];
  level: number;
  filter: Signal<(data: BCDFeatureDetails) => boolean>;
}

const DataRows: FunctionalComponent<Props> = ({ data, level, filter }) => {
  return data.map((item) => (
    <DataRow key={item.id} data={item} level={level} filter={filter} />
  ));
};

export default DataRows;
