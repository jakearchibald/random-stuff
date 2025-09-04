import type { CompatData } from '@mdn/browser-compat-data';
import { render } from 'preact';
import {
  createSimpleBCDData,
  type BCDFeaturePart,
  type BCDSupportData,
} from './process-bcd';

const bcdURL = 'https://unpkg.com/@mdn/browser-compat-data';

// console.log(bcd);

fetch(bcdURL)
  .then((response) => response.json())
  .then((bcd: CompatData) => {
    const simpleBCD = createSimpleBCDData(bcd);
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

    pruneFeatureBranch(dataCopy, notInFirefox);

    console.log(dataCopy);
  });

render(<p>This is a page</p>, document.getElementById('app')!);
