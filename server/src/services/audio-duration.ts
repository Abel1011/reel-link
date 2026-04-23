import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_ROOT = resolve(__dirname, "..", "..", "assets");

// MPEG Audio frame bitrate tables (kbps). Keyed by `${version}-${layer}`.
// version: 3=MPEG1, 2=MPEG2/2.5.  layer: 3=Layer III (we only care about Layer III for MP3).
const BITRATES: Record<string, (number | null)[]> = {
  // MPEG1 Layer III
  "3-3": [null, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, null],
  // MPEG2/2.5 Layer III
  "2-3": [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null],
};
const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG1
  2: [22050, 24000, 16000], // MPEG2
  0: [11025, 12000, 8000],  // MPEG2.5
};

/**
 * Compute MP3 duration in seconds by scanning frame headers (pure JS, no deps).
 * Handles VBR by summing frame durations; falls back to CBR estimate.
 */
export function mp3Duration(buf: Buffer): number {
  let offset = 0;
  // Skip ID3v2 tag
  if (buf.slice(0, 3).toString("ascii") === "ID3") {
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f);
    offset = 10 + size;
  }
  let totalSeconds = 0;
  let framesScanned = 0;
  while (offset + 4 <= buf.length) {
    // Sync word 0xFFFx
    if (buf[offset] !== 0xff || (buf[offset + 1] & 0xe0) !== 0xe0) {
      offset++;
      continue;
    }
    const b1 = buf[offset + 1];
    const b2 = buf[offset + 2];
    const versionBits = (b1 >> 3) & 0x03;
    const layerBits = (b1 >> 1) & 0x03;
    const bitrateIdx = (b2 >> 4) & 0x0f;
    const sampleRateIdx = (b2 >> 2) & 0x03;
    const padding = (b2 >> 1) & 0x01;

    if (versionBits === 1 || layerBits === 0 || bitrateIdx === 0 || bitrateIdx === 15 || sampleRateIdx === 3) {
      offset++;
      continue;
    }
    const layer = 4 - layerBits;
    const isMpeg1 = versionBits === 3;
    const brKey = `${isMpeg1 ? 3 : 2}-${layer}`;
    const bitrateKbps = BITRATES[brKey]?.[bitrateIdx];
    if (!bitrateKbps) {
      offset++;
      continue;
    }
    const sampleRate =
      SAMPLE_RATES[versionBits]?.[sampleRateIdx] ??
      SAMPLE_RATES[2][sampleRateIdx];
    if (!sampleRate) {
      offset++;
      continue;
    }
    const samplesPerFrame = isMpeg1 ? 1152 : 576; // layer III
    const frameLen = Math.floor((samplesPerFrame * bitrateKbps * 1000) / (8 * sampleRate)) + padding;
    if (frameLen < 4) {
      offset++;
      continue;
    }
    totalSeconds += samplesPerFrame / sampleRate;
    framesScanned++;
    offset += frameLen;
    // Safety: bail out on huge files (shouldn't happen for short clips)
    if (framesScanned > 200000) break;
  }
  return totalSeconds;
}

/** Resolve a stored asset relative path (e.g. "audio/xxx.mp3") to its on-disk file. */
export function resolveAssetPath(relPath: string): string {
  const clean = relPath.replace(/^\/?(assets\/)?/, "");
  return resolve(ASSETS_ROOT, clean);
}

/** Measure mp3 duration for a stored asset path. Returns seconds, or 0 on failure. */
export function mp3DurationForAsset(relPath: string | undefined): number {
  if (!relPath) return 0;
  try {
    const buf = readFileSync(resolveAssetPath(relPath));
    return mp3Duration(buf);
  } catch {
    return 0;
  }
}
