import type { SupportOptions } from '../App/EngineSupportOptions';
import type { BCDBrowser, BCDFeaturePart, BCDSupportData } from './process-bcd';

export function filterData(
  data: {
    subfeatures: BCDFeaturePart[];
    details?: { support: BCDSupportData };
  },
  compatTest: (data: BCDSupportData) => boolean
): boolean {
  if (data.details) {
    const support = data.details.support;
    const ofInterest = compatTest(support);

    if (ofInterest) {
      data.subfeatures = [];
      return true;
    }
  }

  const interestingSubfeatures = data.subfeatures.filter((subfeature) =>
    filterData(subfeature, compatTest)
  );

  data.subfeatures = interestingSubfeatures;

  return interestingSubfeatures.length > 0;
}

export function createBrowserSupportFilter(
  options: SupportOptions
): (support: BCDSupportData) => boolean {
  return (support: BCDSupportData) => {
    return Object.entries(options).every(([browser, status]) => {
      if (status === 'either') return true;
      if (status === 'unsupported') {
        return (
          !support[browser as BCDBrowser].desktop.supported &&
          !support[browser as BCDBrowser].mobile.supported
        );
      }

      return (
        support[browser as BCDBrowser].desktop.supported !== '' ||
        support[browser as BCDBrowser].mobile.supported !== ''
      );
    });
  };
}
