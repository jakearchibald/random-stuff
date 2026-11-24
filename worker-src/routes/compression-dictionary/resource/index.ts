import {
  dictionaryHash,
  resource,
  resourceBrBase64,
  resourceDcbBase64,
} from '../data.ts';

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const resourceBr = fromBase64(resourceBrBase64);
const resourceDcb = fromBase64(resourceDcbBase64);

function acceptsEncoding(request: Request, encoding: string): boolean {
  return (request.headers.get('Accept-Encoding') ?? '')
    .split(',')
    .some((part) => part.trim().split(';')[0] === encoding);
}

const route: ExportedHandler<Env>['fetch'] = async (request) => {
  const availableDictionary = request.headers.get('Available-Dictionary');
  const headers = new Headers({
    'Content-Type': 'text/javascript; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Accept-Encoding, Available-Dictionary',
    // Echoed back so the page can show what the browser sent.
    'X-Received-Available-Dictionary': availableDictionary ?? '',
    'X-Received-Accept-Encoding': request.headers.get('Accept-Encoding') ?? '',
  });

  let body: string | Uint8Array = resource;

  // Ideally we'd also check Accept-Encoding includes 'dcb', but workerd
  // rewrites Accept-Encoding to the encodings it knows about (eg 'br, gzip').
  // Browsers only send Available-Dictionary if they support dictionary
  // compression, and the echoed X-Received-Accept-Encoding shows what arrived.
  if (availableDictionary === dictionaryHash) {
    headers.set('Content-Encoding', 'dcb');
    body = resourceDcb;
  } else if (acceptsEncoding(request, 'br')) {
    headers.set('Content-Encoding', 'br');
    body = resourceBr;
  }

  return new Response(body, {
    headers,
    // The body is already encoded, so don't let the runtime encode it again.
    encodeBody: headers.has('Content-Encoding') ? 'manual' : 'automatic',
  });
};

export default route;
