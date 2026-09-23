#!/bin/sh
# Builds the wasm encoder (src/encoder/wasm/aom_preview.{js,wasm}).
#
# Needs emscripten and a libaom checkout with libaom-preview.patch applied:
#   git clone https://aomedia.googlesource.com/aom aom-preview
#   cd aom-preview && git checkout b6f1273ecc && git apply .../libaom-preview.patch
#   AOM=path/to/aom-preview ./build.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
AOM="${AOM:-$HOME/dev/aom-preview}"
BUILD="$AOM/build-wasm${VARIANT:+-$VARIANT}"
OUT="${OUT:-$HERE/../src/encoder/wasm}"
# Same approach as Squoosh's AVIF build: libaom has no wasm SIMD kernels, so
# -msimd128 lets LLVM autovectorise its C; LTO gave another ~13%.
SIMD_FLAGS="${SIMD_FLAGS:--O3 -flto -msimd128}"

if [ ! -f "$BUILD/libaom.a" ]; then
  emcmake cmake -G Ninja -S "$AOM" -B "$BUILD" -DCMAKE_BUILD_TYPE=Release \
    -DAOM_TARGET_CPU="${AOM_TARGET_CPU:-generic}" -DCONFIG_MULTITHREAD=0 \
    -DCONFIG_RUNTIME_CPU_DETECT=0 -DCONFIG_AV1_DECODER=0 -DCONFIG_WEBM_IO=0 \
    -DENABLE_DOCS=0 -DENABLE_EXAMPLES=0 -DENABLE_TESTS=0 -DENABLE_TESTDATA=0 \
    -DENABLE_TOOLS=0 -DCONFIG_ACCOUNTING=0 -DCONFIG_INSPECTION=0 \
    -DCMAKE_C_FLAGS="$SIMD_FLAGS" -DCMAKE_CXX_FLAGS="$SIMD_FLAGS" $EXTRA_CMAKE
  ninja -C "$BUILD" aom
fi

mkdir -p "$OUT"
emcc -O3 $SIMD_FLAGS -I"$AOM" -I"$BUILD" "$HERE/preview_enc.c" "$BUILD/libaom.a" \
  -o "$OUT/aom_preview.js" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT="${ENVIRONMENT:-web,worker}" \
  -sALLOW_MEMORY_GROWTH=1 -sFILESYSTEM=0 -sINITIAL_MEMORY=33554432 -sSTACK_SIZE=4194304 \
  -sEXPORTED_FUNCTIONS=_preview_encode,_preview_output,_preview_error,_malloc,_free \
  -sEXPORTED_RUNTIME_METHODS=HEAPU8,UTF8ToString,stringToNewUTF8
ls -la "$OUT"
