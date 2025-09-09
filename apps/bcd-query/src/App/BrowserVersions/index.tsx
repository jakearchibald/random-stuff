import type { FunctionalComponent } from 'preact';
import type {
  Browsers,
  BrowserStatement,
  ReleaseStatement,
} from '@mdn/browser-compat-data';

import './styles.css';
import { browserOrder } from '../../utils/meta';
import type { BCDBrowser } from '../../utils/process-bcd';

const interestingStates = ['current', 'beta', 'nightly', 'planned'] as const;
const interestingStatesSet = new Set(interestingStates);

function getInterestingBrowserVersions(
  browserStatement: BrowserStatement
): Record<
  (typeof interestingStates)[number],
  { version: string; date: string } | undefined
> {
  const result = {} as Record<
    (typeof interestingStates)[number],
    { version: string; date: string } | undefined
  >;

  for (const [version, data] of Object.entries(browserStatement.releases)) {
    if (interestingStatesSet.has(data.status as any)) {
      result[data.status as (typeof interestingStates)[number]] = {
        version,
        date: data.release_date || 'unknown date',
      };
    }
  }
  return result;
}

interface Props {
  browserData: Browsers;
}

const BrowserVersions: FunctionalComponent<Props> = ({ browserData }) => {
  const browserVersions = {} as Record<
    BCDBrowser,
    ReturnType<typeof getInterestingBrowserVersions>
  >;

  for (const [browser, data] of Object.entries(browserData)) {
    browserVersions[browser as BCDBrowser] =
      getInterestingBrowserVersions(data);
  }

  return (
    <table class="browser-version-table">
      <thead>
        <td />
        {browserOrder.map((browser) => (
          <th key={browser}>{browserData[browser].name}</th>
        ))}
      </thead>
      <tbody>
        {interestingStates.map((state) => (
          <tr key={state}>
            <th>{state}</th>
            {browserOrder.map((browser) => (
              <td key={browser}>
                {browserVersions[browser][state]
                  ? `${browserVersions[browser][state].version} (${browserVersions[browser][state].date})`
                  : ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BrowserVersions;
