import type { EncodeRequest, EncodeResponse } from './worker';

type Job = {
  req: Omit<EncodeRequest, 'id'>;
  resolve: (blob: Uint8Array) => void;
  reject: (err: Error) => void;
};

/**
 * A pool of encoder workers. A preview is a single 128px superblock, so
 * libaom's own threading has nothing to split; instead many candidate
 * encodes (sizes x quantizers) run side by side.
 */
export class EncoderPool {
  #idle: Worker[] = [];
  #queue: Job[] = [];
  #pending = new Map<number, Job & { worker: Worker }>();
  #nextId = 0;

  constructor(size = Math.min(navigator.hardwareConcurrency || 4, 8)) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', (e: MessageEvent<EncodeResponse>) => this.#done(e.data));
      this.#idle.push(worker);
    }
  }

  get size() {
    return this.#idle.length + this.#pending.size;
  }

  encode(req: Omit<EncodeRequest, 'id'>, signal?: AbortSignal): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(signal.reason);
      const job: Job = { req, resolve, reject };
      signal?.addEventListener('abort', () => {
        const i = this.#queue.indexOf(job);
        if (i !== -1) this.#queue.splice(i, 1);
        reject(signal.reason);
      });
      this.#queue.push(job);
      this.#pump();
    });
  }

  #pump() {
    while (this.#idle.length && this.#queue.length) {
      const worker = this.#idle.pop()!;
      const job = this.#queue.shift()!;
      const id = this.#nextId++;
      this.#pending.set(id, { ...job, worker });
      // Copy rather than transfer: the caller may reuse the pixels.
      worker.postMessage({ ...job.req, id } satisfies EncodeRequest);
    }
  }

  #done(res: EncodeResponse) {
    const job = this.#pending.get(res.id);
    if (!job) return;
    this.#pending.delete(res.id);
    this.#idle.push(job.worker);
    if ('blob' in res) job.resolve(res.blob);
    else job.reject(new Error(res.error));
    this.#pump();
  }
}
