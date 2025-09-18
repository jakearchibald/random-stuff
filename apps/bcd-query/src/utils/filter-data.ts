import type { Browsers, BrowserStatus } from '@mdn/browser-compat-data';
import type { Filter } from '../App/FilterOptions';
import type { SupportOptions } from '../App/FilterOptions/EngineSupportOptions';
import type { VersionOptions } from '../App/FilterOptions/VersionSupportOptions';
import type {
  BCDBrowser,
  BCDFeatureDetails,
  BCDFeaturePart,
} from './process-bcd';
import { browserOrder } from './meta';

export function filterData(
  data: {
    subfeatures: BCDFeaturePart[];
    details?: BCDFeaturePart['details'];
  },
  test: (data: BCDFeatureDetails) => boolean
): boolean {
  const interestingSubfeatures = data.subfeatures.filter((subfeature) => {
    return filterData(subfeature, test);
  });

  data.subfeatures = interestingSubfeatures;

  return (
    interestingSubfeatures.length > 0 ||
    Boolean(data.details && test(data.details))
  );
}

export function createFilter(
  filter: Filter,
  browserData: Browsers
): (details: BCDFeatureDetails) => boolean {
  if (filter.type === 'engine-support') {
    return createBrowserSupportFilter(filter.options);
  }
  if (filter.type === 'version-support') {
    return createVersionSupportFilter(filter.options);
  }
  if (filter.type === 'approaching-baseline') {
    return createApproachingBaselineFilter(browserData);
  }
  if (filter.type === 'newly-baseline') {
    return createNewlyBaselineFilter(browserData);
  }
  throw Error('Unknown filter type');
}

function createApproachingBaselineFilter(
  browserData: Browsers
): (details: BCDFeatureDetails) => boolean {
  const preReleaseBrowserVersions = {} as Record<BCDBrowser, Set<string>>;

  for (const browser of browserOrder) {
    preReleaseBrowserVersions[browser] = new Set(['preview']);
    const releases = browserData[browser].releases;

    for (const [version, release] of Object.entries(releases)) {
      if (
        release.status === 'beta' ||
        release.status === 'nightly' ||
        release.status === 'planned'
      ) {
        preReleaseBrowserVersions[browser].add(version);
      }
    }
  }

  return (details: BCDFeatureDetails) => {
    const allSupported = browserOrder.every((browser) => {
      const browserSupport = details.support[browser];

      return (
        browserSupport.desktop.supported || browserSupport.mobile.supported
      );
    });

    if (!allSupported) return false;

    return browserOrder.some((browser) => {
      const prereleaseVersions = preReleaseBrowserVersions[browser];
      const browserSupport = details.support[browser];

      return (
        prereleaseVersions.has(browserSupport.desktop.supported) ||
        prereleaseVersions.has(browserSupport.mobile.supported)
      );
    });
  };
}

function createNewlyBaselineFilter(
  browserData: Browsers
): (details: BCDFeatureDetails) => boolean {
  const acceptableStableStatuses = new Set<BrowserStatus>([
    'current',
    'esr',
    'retired',
  ]);

  return (details: BCDFeatureDetails) => {
    const oneLatest = browserOrder.some((browserName) => {
      const browser = browserData[browserName];
      const browserSupport = details.support[browserName];
      const desktopValue = browser.releases[browserSupport.desktop.supported];
      const mobileValue = browser.releases[browserSupport.mobile.supported];

      return (
        desktopValue?.status === 'current' || mobileValue?.status === 'current'
      );
    });

    if (!oneLatest) return false;

    return browserOrder.every((browserName) => {
      const browser = browserData[browserName];
      const browserSupport = details.support[browserName];
      const desktopValue = browser.releases[browserSupport.desktop.supported];
      const mobileValue = browser.releases[browserSupport.mobile.supported];

      return (
        (acceptableStableStatuses.has(desktopValue?.status) &&
          !browserSupport.desktop.flagged) ||
        (acceptableStableStatuses.has(mobileValue?.status) &&
          !browserSupport.mobile.flagged)
      );
    });
  };
}

function createVersionSupportFilter(
  options: VersionOptions
): (details: BCDFeatureDetails) => boolean {
  return (details: BCDFeatureDetails) => {
    const browserSupport = details.support[options.browser];

    return (
      browserSupport.desktop.supported === options.version ||
      browserSupport.mobile.supported === options.version
    );
  };
}

function createBrowserSupportFilter(
  options: SupportOptions
): (details: BCDFeatureDetails) => boolean {
  return (details: BCDFeatureDetails) => {
    return Object.entries(options).every(([browser, status]) => {
      if (status === 'either') return true;
      if (status === 'unsupported') {
        return (
          !details.support[browser as BCDBrowser].desktop.supported &&
          !details.support[browser as BCDBrowser].mobile.supported
        );
      }

      return (
        details.support[browser as BCDBrowser].desktop.supported ||
        details.support[browser as BCDBrowser].mobile.supported
      );
    });
  };
}

export function createTitleFilter(
  term: string
): (details: BCDFeatureDetails) => boolean {
  const lowerTerm = term
    .toLowerCase()
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);

  return (details: BCDFeatureDetails) => {
    if (lowerTerm.length === 0) return true;
    const lowerName = details.name.toLowerCase();
    return lowerTerm.every((word) => lowerName.includes(word));
  };
}
