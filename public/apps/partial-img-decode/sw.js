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
 * Controllers of in-flight never-ending responses, keyed by image id.
 * @type {Map<string, Set<ReadableStreamDefaultController>>}
 */
const openControllers = new Map();

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

  return neverEndingResponse(blob.slice(0, length, blob.type), id);
}

onmessage = (event) => {
  if (event.data.action === 'img-blob') {
    const { id, blob } = event.data;
    const resolve = blobResolver.get(id);
    if (resolve) {
      resolve(blob);
      blobResolver.delete(id);
    }
  } else if (event.data.action === 'terminate-img') {
    const { id, errorStream } = event.data;
    const controllers = openControllers.get(id);
    if (!controllers) return;
    openControllers.delete(id);
    for (const controller of controllers) {
      try {
        if (errorStream) {
          controller.error(new Error('Image request terminated'));
        } else {
          controller.close();
        }
      } catch {
        // Already closed or errored
      }
    }
  }
};

/**
 * A response that sends the given bytes, then stays open forever, until
 * closed or errored via a `terminate-img` message.
 *
 * @param {Blob} blob
 * @param {string} id
 * @returns
 */
function neverEndingResponse(blob, id) {
  /** @type {ReadableStreamDefaultController} */
  let streamController;

  const body = new ReadableStream({
    async start(controller) {
      streamController = controller;
      let controllers = openControllers.get(id);
      if (!controllers) {
        controllers = new Set();
        openControllers.set(id, controllers);
      }
      controllers.add(controller);

      const ab = await blob.arrayBuffer();
      const bytes = new Uint8Array(ab);
      controller.enqueue(bytes);
    },
    cancel() {
      openControllers.get(id)?.delete(streamController);
    },
  });

  return new Response(body, { headers: { 'Content-Type': blob.type } });
}
