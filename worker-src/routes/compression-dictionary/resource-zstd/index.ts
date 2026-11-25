import {
  resourceBrBase64,
  resourceDczBase64,
  resourceZstdBase64,
} from '../data.ts';
import { createResourceRoute, fromBase64 } from '../shared.ts';

export default createResourceRoute(
  { encoding: 'dcz', body: fromBase64(resourceDczBase64) },
  [
    { encoding: 'zstd', body: fromBase64(resourceZstdBase64) },
    // In case zstd was removed from Accept-Encoding (see shared.ts).
    { encoding: 'br', body: fromBase64(resourceBrBase64) },
  ],
);
