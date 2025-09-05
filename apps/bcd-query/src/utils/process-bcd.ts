import type {
  Identifier,
  CompatStatement,
  BrowserName,
  CompatData,
  SimpleSupportStatement,
} from '@mdn/browser-compat-data';

export interface BCDSimpleData {
  subfeatures: BCDFeaturePart[];
}

export type BCDBrowser = 'chrome' | 'firefox' | 'safari';

export type BCDSupportData = Record<
  BCDBrowser,
  {
    desktop: string;
    mobile: string;
  }
>;

export interface BCDFeaturePart {
  subfeatures: BCDFeaturePart[];
  id: string;
  bcdData: Identifier;
  details?: {
    name: string;
    mdnURL: string;
    support: BCDSupportData;
  };
}

type IdentifierKeys = {
  [K in keyof CompatData]: CompatData[K] extends Identifier ? K : never;
}[keyof CompatData];

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

export function createSimpleBCDData(bcd: CompatData): BCDSimpleData {
  return {
    subfeatures: topLevelKeys.map((key) =>
      createFeaturePart(bcd as unknown as Identifier, key)
    ),
  };
}

function getSupportValue(entry: SimpleSupportStatement | undefined): string {
  if (!entry || entry.version_removed || entry.flags?.[0]) return '';
  return entry.version_added || '';
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
      desktop: getSupportValue(desktopSupportEntry),
      mobile: getSupportValue(mobileSupportEntry),
    };
  }

  return supportData as BCDSupportData;
}

function createFeaturePart(data: Identifier, key: string): BCDFeaturePart {
  const feature = data[key];

  if (!feature) throw new Error(`Feature not found: ${key}`);

  const { __compat, ...subfeatures } = feature;

  return {
    subfeatures: Object.keys(subfeatures).map((key) =>
      createFeaturePart(feature, key)
    ),
    id: key,
    bcdData: feature,
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
