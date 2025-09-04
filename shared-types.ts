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
  details?: {
    name: string;
    mdnURL: string;
    support: BCDSupportData;
  };
}
