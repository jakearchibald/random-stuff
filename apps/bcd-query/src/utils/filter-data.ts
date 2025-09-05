import type { BCDFeaturePart, BCDSupportData } from './process-bcd';

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

export const onlyMissingInFirefox = (support: BCDSupportData) =>
  Boolean(
    (support.chrome.desktop || support.chrome.mobile) &&
      (support.safari.desktop || support.safari.mobile) &&
      !support.firefox.desktop &&
      !support.firefox.mobile
  );

export const missingInFirefox = (support: BCDSupportData) =>
  Boolean(!support.firefox.desktop && !support.firefox.mobile);

export const onlyInFirefox = (support: BCDSupportData) =>
  Boolean(
    !support.chrome.desktop &&
      !support.chrome.mobile &&
      !support.safari.desktop &&
      !support.safari.mobile &&
      (support.firefox.desktop || support.firefox.mobile)
  );
