/// <reference lib="webworker" />
/** @type {ServiceWorkerGlobalScope} */
const swGlobal = globalThis;

swGlobal.oninstall = () => {
  swGlobal.skipWaiting();
};

swGlobal.onactivate = () => {
  swGlobal.clients.claim();
};

swGlobal.onfetch = (event) => {
  const url = new URL(event.request.url);

  if (
    url.origin === location.origin &&
    url.pathname === '/apps/partial-img-decode/img'
  ) {
    event.respondWith(partialImgFetch(event));
  }
};

/**
 * @type {Map<string, Promise<Blob>>}
 */
const blobMap = new Map();

/**
 * @type {Map<string, (blob: Blob) => void>}
 */
const blobResolver = new Map();

/**
 * @param {FetchEvent} event
 */
async function partialImgFetch(event) {
  const url = new URL(event.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  if (!blobMap.has(id)) {
    const { promise, resolve } = Promise.withResolvers();
    blobMap.set(id, promise);
    blobResolver.set(id, resolve);

    const client = await swGlobal.clients.get(event.clientId);
    if (!client) {
      return new Response('No client', { status: 400 });
    }
    client.postMessage({ action: 'provide-img', id });
  }

  const blob = await blobMap.get(id);
  const length = Number(url.searchParams.get('length'));

  if (!length) {
    return new Response('Missing length', { status: 400 });
  }

  if (length === blob.size) return new Response(blob);

  return neverEndingResponse(blob.slice(0, length, blob.type));
}

onmessage = (event) => {
  if (event.data.action === 'img-blob') {
    const { id, blob } = event.data;
    const resolve = blobResolver.get(id);
    if (resolve) {
      resolve(blob);
      blobResolver.delete(id);
    }
  }
};

/**
 * @param {Blob} blob
 * @returns
 */
function neverEndingResponse(blob) {
  const body = new ReadableStream({
    start(controller) {
      blob.arrayBuffer().then((ab) => {
        const bytes = new Uint8Array(ab);
        controller.enqueue(bytes);
      });
    },
  });

  return new Response(body, { headers: { 'Content-Type': blob.type } });
}
