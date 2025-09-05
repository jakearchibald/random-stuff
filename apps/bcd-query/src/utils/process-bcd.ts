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

export interface BCDSupportStatement {
  supported: string;
  flagged: boolean;
  partial: boolean;
  notes: string[];
}

export type BCDSupportData = Record<
  BCDBrowser,
  {
    desktop: BCDSupportStatement;
    mobile: BCDSupportStatement;
  }
>;

export interface BCDFeaturePart {
  subfeatures: BCDFeaturePart[];
  id: string;
  bcdData: Identifier;
  details?: {
    name: string;
    mdnURL: string;
    specURLs: string[];
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

function getSupportedValue(entry: SimpleSupportStatement | undefined): string {
  if (!entry || entry.version_removed) return '';
  return entry.version_added || '';
}

function getSupportStatement(
  entry: SimpleSupportStatement | undefined
): BCDSupportStatement {
  const notes = (() => {
    if (!entry || !entry.notes) return [];
    if (Array.isArray(entry.notes)) return entry.notes;
    return [entry.notes];
  })();

  const partial = (() => {
    if (!entry) return false;
    return Boolean(entry.partial_implementation);
  })();

  return {
    supported: getSupportedValue(entry),
    flagged: Boolean(entry?.flags?.length),
    notes,
    partial,
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
      desktop: getSupportStatement(desktopSupportEntry),
      mobile: getSupportStatement(mobileSupportEntry),
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
            specURLs: __compat.spec_url
              ? Array.isArray(__compat.spec_url)
                ? __compat.spec_url
                : [__compat.spec_url]
              : [],
            support: createSupportData(__compat),
          }
        : undefined,
  };
}
