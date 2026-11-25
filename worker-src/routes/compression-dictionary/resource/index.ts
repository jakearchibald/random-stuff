import { resourceBrBase64, resourceDcbBase64 } from '../data.ts';
import { createResourceRoute, fromBase64 } from '../shared.ts';

export default createResourceRoute(
  { encoding: 'dcb', body: fromBase64(resourceDcbBase64) },
  [{ encoding: 'br', body: fromBase64(resourceBrBase64) }],
);
