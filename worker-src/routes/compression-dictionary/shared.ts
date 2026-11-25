import { dictionary, dictionaryHash, resource } from './data.ts';

export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function acceptsEncoding(request: Request, encoding: string): boolean {
  return (request.headers.get('Accept-Encoding') ?? '')
    .split(',')
    .some((part) => part.trim().split(';')[0] === encoding);
}

/** Serves the dictionary, to be used for requests matching `matchPattern`. */
export function createDictionaryRoute(
  matchPattern: string,
): ExportedHandler<Env>['fetch'] {
  return async () =>
    new Response(dictionary, {
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        // Tells the browser to keep this response as a dictionary for matching requests.
        'Use-As-Dictionary': `match="${matchPattern}"`,
        // The dictionary lives as long as the HTTP cache entry.
        'Cache-Control': 'max-age=3600',
      },
    });
}

interface Encoded {
  encoding: string;
  body: Uint8Array;
}

/**
 * Serves the resource, using `withDictionary` if the browser has the
 * dictionary, otherwise the first of `fallbacks` the browser accepts.
 */
export function createResourceRoute(
  withDictionary: Encoded,
  fallbacks: Encoded[],
): ExportedHandler<Env>['fetch'] {
  return async (request) => {
    const availableDictionary = request.headers.get('Available-Dictionary');
    const headers = new Headers({
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      Vary: 'Accept-Encoding, Available-Dictionary',
      // Echoed back so the page can show what the browser sent.
      'X-Received-Available-Dictionary': availableDictionary ?? '',
      'X-Received-Accept-Encoding':
        request.headers.get('Accept-Encoding') ?? '',
    });

    // Ideally we'd also check Accept-Encoding includes the dictionary
    // encoding, but workerd rewrites Accept-Encoding to the encodings it knows
    // about (eg 'br, gzip'). Browsers only send Available-Dictionary if they
    // support dictionary compression, and the echoed
    // X-Received-Accept-Encoding shows what arrived.
    const chosen =
      availableDictionary === dictionaryHash
        ? withDictionary
        : fallbacks.find(({ encoding }) => acceptsEncoding(request, encoding));

    if (!chosen) return new Response(resource, { headers });

    headers.set('Content-Encoding', chosen.encoding);

    return new Response(chosen.body, {
      headers,
      // The body is already encoded, so don't let the runtime encode it again.
      encodeBody: 'manual',
    });
  };
}
