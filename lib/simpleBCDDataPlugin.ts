import type { Plugin } from 'vite';
import bcd from '@mdn/browser-compat-data' with { type: 'json' };
import type {
  Identifier,
  CompatStatement,
  BrowserName,
} from '@mdn/browser-compat-data';

import type {
  BCDFeaturePart,
  BCDSimpleData,
  BCDSupportData,
  BCDBrowser,
} from '../shared-types.js';

const moduleId = 'simple-bcd:';

type IdentifierKeys = {
  [K in keyof typeof bcd]: (typeof bcd)[K] extends Identifier ? K : never;
}[keyof typeof bcd];

const topLevelKeys: IdentifierKeys[] = [
  'api',
  'css',
  'html',
  'http',
  'javascript',
  'mathml',
  'svg',
  'manifests',
  'webassembly',
] as const;

const browserMobilePairs: [BrowserName, BrowserName][] = [
  ['chrome', 'chrome_android'],
  ['firefox', 'firefox_android'],
  ['safari', 'safari_ios'],
] as const;

function createSimpleBCDData(): BCDSimpleData {
  return {
    subfeatures: topLevelKeys.map((key) =>
      createFeaturePart(bcd as unknown as Identifier, key)
    ),
  };
}

function createSupportData(data: CompatStatement): BCDSupportData {
  const supportData: Partial<BCDSupportData> = {};

  for (const [browser, mobileBrowser] of browserMobilePairs) {
    const desktopSupport = data.support[browser];
    const mobileSupport = data.support[mobileBrowser];

    const desktopSupportEntry = desktopSupport
      ? Array.isArray(desktopSupport)
        ? desktopSupport[0]
        : desktopSupport
      : undefined;

    const mobileSupportEntry = mobileSupport
      ? Array.isArray(mobileSupport)
        ? mobileSupport[0]
        : mobileSupport
      : undefined;

    supportData[browser as BCDBrowser] = {
      desktop: desktopSupportEntry?.version_removed ? '' : desktopSupportEntry?.version_added || '',
      mobile: mobileSupportEntry?.version_removed ? '' : mobileSupportEntry?.version_added || '',
    };
  }

  return supportData as BCDSupportData;
}

function createFeaturePart(data: Identifier, key: string): BCDFeaturePart {
  const feature = data[key];

  if (!feature) throw new Error(`Feature not found: ${key}`);

  const { __compat, ...subfeatures } = feature;

  return {
    subfeatures: Object.keys(subfeatures).map((key) => createFeaturePart(feature, key)),
    id: key,
    details:
      __compat && !__compat.status?.deprecated
        ? {
            name: __compat.description || '',
            mdnURL: __compat.mdn_url || '',
            support: createSupportData(__compat),
          }
        : undefined,
  };
}

export function simpleBCDDataPlugin(): Plugin {
  return {
    name: 'simple-bcd-data-plugin',
    resolveId(id) {
      if (moduleId === id) return id;
    },
    load(id) {
      if (id === moduleId) {
        return `export default ${JSON.stringify(createSimpleBCDData())}`;
      }
    },
  };
}
