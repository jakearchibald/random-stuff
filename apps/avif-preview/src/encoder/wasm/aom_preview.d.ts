// Types for the emscripten module built by encoder-build/build.sh.
export interface AomPreviewModule {
  HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(ptr: number): void;
  /** Returns the output size, or -1 (see _preview_error). */
  _preview_encode(
    y: number,
    u: number,
    v: number,
    width: number,
    height: number,
    quantizer: number,
    speed: number,
    wiener: number
  ): number;
  _preview_output(): number;
  _preview_error(): number;
  UTF8ToString(ptr: number): string;
  stringToNewUTF8(str: string): number;
}

declare const factory: () => Promise<AomPreviewModule>;
export default factory;
