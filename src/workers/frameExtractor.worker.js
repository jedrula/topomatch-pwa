/**
 * Frame extractor web worker.
 *
 * Uses mp4box.js to demux only the I-frames (sync samples) from the MP4
 * container, then decodes them with the WebCodecs VideoDecoder API.
 * I-frames are independently decodable — no reference frames needed —
 * so we never pay the random-seek keyframe penalty that the <video> approach does.
 *
 * Protocol (postMessage from main → worker):
 *   { file: File, motionThresh: number, blurPct: number }
 *
 * Protocol (postMessage worker → main):
 *   { type: 'total',    count: number }          — keyframe count after demux
 *   { type: 'progress', current: number }         — after each keyframe scored
 *   { type: 'done',     frames: Frame[] }         — selected frames
 *   { type: 'error',    message: string }
 *
 * Frame = { thumbBlob: Blob, fullBlob: Blob, timeS: number, blurScore: number }
 */

import { createFile, DataStream } from 'mp4box';

const THUMB = 64;
const MAX_W = 1920;
const MAX_H = 1080;

// ── Entry point ───────────────────────────────────────────────
self.onmessage = async ({ data }) => {
  try {
    const { file, motionThresh, blurPct } = data;
    const frames = await run(file, motionThresh, blurPct);
    self.postMessage({ type: 'done', frames }, frames.map(f => f.fullBlob));
  } catch (e) {
    self.postMessage({ type: 'error', message: e.message });
  }
};

// ── Main pipeline ─────────────────────────────────────────────
async function run(file, motionThresh, blurPct) {
  // Phase 1: demux — collect all keyframe samples
  const { decoderConfig, keyframes } = await demux(file);
  self.postMessage({ type: 'total', count: keyframes.length });

  if (keyframes.length === 0) throw new Error('No keyframes found in video');

  // Check WebCodecs support before trying to decode
  const check = await VideoDecoder.isConfigSupported(decoderConfig);
  if (!check.supported) {
    // Signal main thread to use the <video> fallback instead
    self.postMessage({ type: 'codec-unsupported', codec: decoderConfig.codec });
    return [];
  }

  // Phase 2: decode all keyframes → thumbnail + blur score
  const thumbCanvas = new OffscreenCanvas(THUMB, THUMB);
  const thumbCtx = thumbCanvas.getContext('2d', { willReadFrequently: true });

  const decoder = new KeyframeDecoder(decoderConfig);
  const scored = [];

  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i];
    const frame = await decoder.decode(kf);

    thumbCtx.drawImage(frame, 0, 0, THUMB, THUMB);
    const px = thumbCtx.getImageData(0, 0, THUMB, THUMB).data;
    frame.close();

    scored.push({
      timeS: kf.cts / kf.timescale,
      blurScore: pixelVariance(px),
      px: px.slice(), // for motion diff
      data: kf.data,  // keep encoded bytes for full-res re-decode
    });

    self.postMessage({ type: 'progress', current: i + 1 });
  }
  decoder.close();

  // Phase 3: motion-threshold selection, then blur percentile filter
  const motionSelected = applyMotionFilter(scored, motionThresh);
  const blurCutoff = getBlurCutoff(motionSelected, blurPct);
  const selected = motionSelected.filter(f => f.blurScore >= blurCutoff);

  if (selected.length === 0) throw new Error('All frames filtered out — try lower blur % or motion threshold');

  // Phase 4: re-decode selected frames at full resolution → blobs
  const thumbCanvasFull = new OffscreenCanvas(THUMB, THUMB);
  const thumbCtxFull = thumbCanvasFull.getContext('2d');
  const decoder2 = new KeyframeDecoder(decoderConfig);
  const frames = [];

  for (const kf of selected) {
    const frame = await decoder2.decode(kf);

    // Thumbnail blob for the review grid
    thumbCtxFull.drawImage(frame, 0, 0, THUMB, THUMB);
    const thumbBlob = await thumbCanvasFull.convertToBlob({ type: 'image/jpeg', quality: 0.8 });

    // Full-res blob for upload (capped at 1920×1080)
    const scale = Math.min(1, MAX_W / frame.codedWidth, MAX_H / frame.codedHeight);
    const w = Math.round(frame.codedWidth * scale);
    const h = Math.round(frame.codedHeight * scale);
    const fullCanvas = new OffscreenCanvas(w, h);
    fullCanvas.getContext('2d').drawImage(frame, 0, 0, w, h);
    const fullBlob = await fullCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 });

    frame.close();
    frames.push({ thumbBlob, fullBlob, timeS: kf.timeS, blurScore: kf.blurScore });
  }
  decoder2.close();

  return frames;
}

// ── mp4box demuxer ────────────────────────────────────────────
// Read the whole file at once so mp4box can locate moov regardless of whether
// it sits before or after mdat (QuickTime MOV always puts moov at the end).
async function demux(file) {
  const buffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const mp4 = createFile();
    let decoderConfig = null;
    let trackId = null;
    const keyframes = [];

    mp4.onError = (e) => {
      // Non-fatal for unknown/proprietary boxes (QuickTime `wide`, Apple metadata, etc.)
      if (/invalid box type|unknown box/i.test(String(e))) {
        console.warn('[mp4box]', e);
      } else {
        reject(new Error(`mp4box: ${e}`));
      }
    };

    mp4.onReady = (info) => {
      const track = info.videoTracks[0];
      if (!track) { reject(new Error('No video track found')); return; }
      trackId = track.id;
      decoderConfig = buildDecoderConfig(mp4, track);
      mp4.setExtractionOptions(trackId, null, { nbSamples: 1000 });
      mp4.start();
    };

    mp4.onSamples = (id, _ref, samples) => {
      for (const s of samples) {
        if (s.is_sync) {
          keyframes.push({
            data: s.data.slice(),
            dts: s.dts,
            cts: s.cts,
            timescale: s.timescale,
          });
        }
        mp4.releaseUsedSamples(id, s.number);
      }
    };

    // Feed the entire file in one shot — callbacks fire synchronously inside appendBuffer
    buffer.fileStart = 0;
    mp4.appendBuffer(buffer);
    mp4.flush();

    // Resolve after a tick in case any callbacks are queued asynchronously
    setTimeout(() => {
      if (!trackId) { reject(new Error('No video track found — is this a valid MP4/MOV?')); return; }
      resolve({ decoderConfig, keyframes });
    }, 0);
  });
}

function buildDecoderConfig(mp4, track) {
  const trak = mp4.getTrackById(track.id);
  const entry = trak.mdia.minf.stbl.stsd.entries[0];
  const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;

  let description;
  if (box) {
    const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
    box.write(stream);
    description = new Uint8Array(stream.buffer, 8); // skip 8-byte box header (size+type)
  }

  return {
    codec: track.codec,
    codedWidth: track.video.width,
    codedHeight: track.video.height,
    ...(description ? { description } : {}),
  };
}

// ── WebCodecs decoder (reusable, sequential keyframes) ────────
class KeyframeDecoder {
  constructor(config) {
    this._queue = [];
    this._decoder = new VideoDecoder({
      output: (frame) => this._queue.shift()?.(frame),
      error: (e) => { this._queue.shift()?.(null); console.error('VideoDecoder:', e); },
    });
    this._decoder.configure(config);
  }

  decode(kf) {
    return new Promise((resolve) => {
      this._queue.push(resolve);
      this._decoder.decode(new EncodedVideoChunk({
        type: 'key',
        timestamp: kf.cts * 1e6 / kf.timescale,
        data: kf.data,
      }));
    });
  }

  close() { this._decoder.close(); }
}

// ── Frame scoring & selection ─────────────────────────────────
function pixelVariance(data) {
  let sum = 0, sumSq = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += g; sumSq += g * g;
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

function pixelDiff(a, b) {
  let sum = 0;
  const n = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    const gA = (0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]) / 255;
    const gB = (0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]) / 255;
    sum += Math.abs(gA - gB);
  }
  return sum / n;
}

function applyMotionFilter(scored, motionThresh) {
  const selected = [];
  let lastPx = null;
  let cumMotion = 0;
  for (const f of scored) {
    if (!lastPx) { selected.push(f); lastPx = f.px; continue; }
    cumMotion += pixelDiff(f.px, lastPx);
    lastPx = f.px;
    if (cumMotion >= motionThresh) {
      selected.push(f);
      cumMotion = 0;
    }
  }
  return selected;
}

function getBlurCutoff(frames, blurPct) {
  if (frames.length === 0) return 0;
  const sorted = [...frames].sort((a, b) => a.blurScore - b.blurScore);
  return sorted[Math.floor(sorted.length * blurPct / 100)]?.blurScore ?? 0;
}
