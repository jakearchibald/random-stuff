import type { Filter } from '../App/FilterOptions';
import type { SupportOptions } from '../App/FilterOptions/EngineSupportOptions';
import type { VersionOptions } from '../App/FilterOptions/VersionSupportOptions';
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

export function createFilter(
  filter: Filter
): (support: BCDSupportData) => boolean {
  if (filter.type === 'engine-support') {
    return createBrowserSupportFilter(filter.options);
  }
  if (filter.type === 'version-support') {
    return createVersionSupportFilter(filter.options);
  }
  throw Error('Unknown filter type');
}

function createVersionSupportFilter(
  options: VersionOptions
): (support: BCDSupportData) => boolean {
  return (support: BCDSupportData) => {
    const browserSupport = support[options.browser];

    return (
      browserSupport.desktop.supported === options.version ||
      browserSupport.mobile.supported === options.version
    );
  };
}

function createBrowserSupportFilter(
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
