// Minimal AV1 still-image encoder for the AVIF preview format.
//
// Configures (patched) libaom exactly like `avifenc -s 0 -y 444 --cicp 1/13/6
// -r full -j 1 -a tune=ssim` does for a single image, plus the AOM_PREVIEW_*
// overrides from libaom-preview.patch that keep the frame header fixed:
//   - a forced Wiener loop-restoration filter (the preview's blur)
//   - loop filter off
//   - no screen content tools, always TX_MODE_SELECT
//
// Output is the raw OBU stream libaom produces (temporal delimiter, sequence
// header, frame). The JS side extracts the frame OBU and packs it.

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "aom/aom_encoder.h"
#include "aom/aomcx.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

static uint8_t *g_out = NULL;
static size_t g_out_size = 0;
static size_t g_out_cap = 0;
static char g_error[256];

static int append(const void *data, size_t size) {
  if (g_out_size + size > g_out_cap) {
    size_t cap = g_out_cap ? g_out_cap * 2 : 4096;
    while (cap < g_out_size + size) cap *= 2;
    uint8_t *p = realloc(g_out, cap);
    if (!p) return 0;
    g_out = p;
    g_out_cap = cap;
  }
  memcpy(g_out + g_out_size, data, size);
  g_out_size += size;
  return 1;
}

static int fail(aom_codec_ctx_t *ctx, const char *what) {
  snprintf(g_error, sizeof(g_error), "%s: %s", what,
           ctx ? aom_codec_error_detail(ctx) ? aom_codec_error_detail(ctx)
                                             : aom_codec_error(ctx)
               : "");
  return -1;
}

EMSCRIPTEN_KEEPALIVE const uint8_t *preview_output(void) { return g_out; }
EMSCRIPTEN_KEEPALIVE const char *preview_error(void) { return g_error; }

// planes: I444, tightly packed (Y, U and V are each width x height).
// wiener: "y0,y1,y2/c1,c2" outer Wiener taps in 1/128 units.
// Returns the number of output bytes (read them via preview_output()), or -1
// (message via preview_error()).
EMSCRIPTEN_KEEPALIVE int preview_encode(const uint8_t *y, const uint8_t *u,
                                        const uint8_t *v, int width,
                                        int height, int quantizer, int speed,
                                        const char *wiener) {
  g_out_size = 0;
  g_error[0] = 0;

  // The patched libaom reads these (see libaom-preview.patch).
  setenv("AOM_PREVIEW_WIENER", wiener, 1);
  setenv("AOM_PREVIEW_LF", "0,0,0", 1);
  setenv("AOM_PREVIEW_NO_SCT", "1", 1);
  setenv("AOM_PREVIEW_TX_SELECT", "1", 1);

  aom_codec_iface_t *iface = aom_codec_av1_cx();
  aom_codec_enc_cfg_t cfg;
  if (aom_codec_enc_config_default(iface, &cfg, AOM_USAGE_ALL_INTRA))
    return fail(NULL, "config_default");
  cfg.rc_end_usage = AOM_Q;
  cfg.g_profile = 1;  // High: 4:4:4
  cfg.g_bit_depth = AOM_BITS_8;
  cfg.g_input_bit_depth = 8;
  cfg.g_w = width;
  cfg.g_h = height;
  cfg.g_limit = 1;  // still_picture + reduced_still_picture_header
  cfg.g_threads = 1;
  cfg.rc_min_quantizer = quantizer;
  cfg.rc_max_quantizer = quantizer;

  aom_codec_ctx_t ctx;
  if (aom_codec_enc_init(&ctx, iface, &cfg, 0)) return fail(&ctx, "enc_init");

  int ok = 1;
  ok &= !aom_codec_control(&ctx, AOME_SET_CQ_LEVEL, quantizer);
  ok &= !aom_codec_control(&ctx, AOME_SET_CPUUSED, speed);
  ok &= !aom_codec_control(&ctx, AV1E_SET_COLOR_PRIMARIES, AOM_CICP_CP_BT_709);
  ok &= !aom_codec_control(&ctx, AV1E_SET_TRANSFER_CHARACTERISTICS,
                           AOM_CICP_TC_SRGB);
  ok &= !aom_codec_control(&ctx, AV1E_SET_MATRIX_COEFFICIENTS,
                           AOM_CICP_MC_BT_601);
  ok &= !aom_codec_control(&ctx, AV1E_SET_COLOR_RANGE, AOM_CR_FULL_RANGE);
  ok &= !aom_codec_control(&ctx, AV1E_SET_SKIP_POSTPROC_FILTERING, 1);
  ok &= !aom_codec_control(&ctx, AOME_SET_TUNING, AOM_TUNE_SSIM);
  if (speed > 0) {
    // Speed 0 + tune=ssim already produces this sequence header; faster
    // speeds would change it, so pin it (the converter regenerates it).
    ok &= !aom_codec_control(&ctx, AV1E_SET_SUPERBLOCK_SIZE,
                             AOM_SUPERBLOCK_SIZE_128X128);
    ok &= !aom_codec_control(&ctx, AV1E_SET_ENABLE_CDEF, 0);
    ok &= !aom_codec_control(&ctx, AV1E_SET_ENABLE_RESTORATION, 1);
    ok &= !aom_codec_control(&ctx, AV1E_SET_ENABLE_FILTER_INTRA, 1);
    ok &= !aom_codec_control(&ctx, AV1E_SET_ENABLE_INTRA_EDGE_FILTER, 1);
  }
  if (!ok) {
    fail(&ctx, "codec_control");
    aom_codec_destroy(&ctx);
    return -1;
  }

  aom_image_t img;
  memset(&img, 0, sizeof(img));
  img.fmt = AOM_IMG_FMT_I444;
  img.bit_depth = 8;
  img.w = img.d_w = width;
  img.h = img.d_h = height;
  img.bps = 24;
  img.x_chroma_shift = img.y_chroma_shift = 0;
  img.planes[0] = (uint8_t *)y;
  img.planes[1] = (uint8_t *)u;
  img.planes[2] = (uint8_t *)v;
  img.stride[0] = img.stride[1] = img.stride[2] = width;
  img.range = AOM_CR_FULL_RANGE;
  img.cp = AOM_CICP_CP_BT_709;
  img.tc = AOM_CICP_TC_SRGB;
  img.mc = AOM_CICP_MC_BT_601;

  const aom_image_t *frames[2] = { &img, NULL };  // then flush
  for (int i = 0; i < 2 && ok; i++) {
    if (aom_codec_encode(&ctx, frames[i], 0, 1, 0)) {
      fail(&ctx, "encode");
      ok = 0;
      break;
    }
    aom_codec_iter_t iter = NULL;
    const aom_codec_cx_pkt_t *pkt;
    while ((pkt = aom_codec_get_cx_data(&ctx, &iter))) {
      if (pkt->kind == AOM_CODEC_CX_FRAME_PKT &&
          !append(pkt->data.frame.buf, pkt->data.frame.sz)) {
        snprintf(g_error, sizeof(g_error), "out of memory");
        ok = 0;
      }
    }
  }
  aom_codec_destroy(&ctx);
  return ok ? (int)g_out_size : -1;
}

#ifndef __EMSCRIPTEN__
// Native test driver: preview_enc in.yuv width height quantizer speed wiener out.obu
int main(int argc, char **argv) {
  if (argc != 8) {
    fprintf(stderr, "usage: %s in.yuv w h quantizer speed wiener out.obu\n", argv[0]);
    return 2;
  }
  int w = atoi(argv[2]), h = atoi(argv[3]);
  size_t ys = (size_t)w * h, cs = ys;
  uint8_t *buf = malloc(ys + 2 * cs);
  FILE *f = fopen(argv[1], "rb");
  if (!f || fread(buf, 1, ys + 2 * cs, f) != ys + 2 * cs) return 1;
  fclose(f);
  int n = preview_encode(buf, buf + ys, buf + ys + cs, w, h, atoi(argv[4]),
                         atoi(argv[5]), argv[6]);
  if (n < 0) {
    fprintf(stderr, "%s\n", g_error);
    return 1;
  }
  f = fopen(argv[7], "wb");
  fwrite(g_out, 1, n, f);
  fclose(f);
  return 0;
}
#endif
