# AVIF preview encoder (wasm)

`src/encoder/wasm/aom_preview.{js,wasm}` is libaom built with emscripten, plus
`preview_enc.c`, a small wrapper that configures libaom the way
`avifenc -s 0 -y 444 --cicp 1/13/6 -r full -j 1 -a tune=ssim` does for a
single image (verified byte-identical at speed 0; faster speeds pin the
sequence header, which avifenc doesn't).

libaom needs `libaom-preview.patch` (on top of commit b6f1273ecc). It adds
env-var overrides, which the wrapper sets, that keep the AV1 frame header fixed so
the format doesn't need to store it:

- `AOM_PREVIEW_WIENER`: force a Wiener loop-restoration filter (the preview's
  blur) on every plane
- `AOM_PREVIEW_LF`: loop filter levels (0)
- `AOM_PREVIEW_NO_SCT`: no screen content tools
- `AOM_PREVIEW_TX_SELECT`: always TX_MODE_SELECT

(`AOM_PREVIEW_QINDEX` and `AOM_PREVIEW_CHROMA_DQ` are research leftovers and
unused.)

Build:

```sh
git clone https://aomedia.googlesource.com/aom aom-preview
cd aom-preview && git checkout b6f1273ecc && git apply path/to/libaom-preview.patch
AOM=path/to/aom-preview ./build.sh
```

Like Squoosh's AVIF build, this uses libaom's generic C code, auto-vectorised with
`-msimd128` (libaom has no wasm SIMD kernels), plus LTO. It's single-threaded:
a preview is one 128px superblock, so the app runs many candidate encodes in
parallel workers instead. Speeds 0-4 keep the fixed sequence header; 5+ don't.

The format and the research behind it are in libavif's `preview/` directory
(`plan.md`).
