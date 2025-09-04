import simpleBCD from 'simple-bcd:';
// import bcd from '@mdn/browser-compat-data' with { type: 'json' };
import { render } from 'preact';
import type { BCDFeaturePart, BCDSupportData } from '../../shared-types';

// console.log(bcd);

const dataCopy = structuredClone(simpleBCD);

function pruneFeatureBranch(
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
    pruneFeatureBranch(subfeature, compatTest)
  );

  data.subfeatures = interestingSubfeatures;

  return interestingSubfeatures.length > 0;
}

const notInFirefox = (support: BCDSupportData) =>
  Boolean(
    (support.chrome.desktop || support.chrome.mobile) &&
      (support.safari.desktop || support.safari.mobile) &&
      !support.firefox.desktop &&
      !support.firefox.mobile
  );

const onlyInFirefox = (support: BCDSupportData) =>
  Boolean(
    !support.chrome.desktop &&
      !support.chrome.mobile &&
      !support.safari.desktop &&
      !support.safari.mobile &&
      (support.firefox.desktop || support.firefox.mobile)
  );

pruneFeatureBranch(dataCopy, onlyInFirefox);

console.log(dataCopy);

render(<p>This is a page</p>, document.getElementById('app')!);
