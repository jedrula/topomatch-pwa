/**
 * Frame extractor web worker — Mediabunny edition.
 *
 * Protocol (postMessage main → worker):
 *   { file: File, nFrames: number, startTime: number, endTime: number }
 *
 * Protocol (postMessage worker → main):
 *   { type: 'total',         count: number }
 *   { type: 'frame-scored',  index: number, timeS: number, score: number, thumbBlob: Blob }
 *   { type: 'selection',     batches: Batch[], selectedIndices: number[] }
 *   { type: 'done',          frames: Frame[] }
 *   { type: 'error',         message: string }
 *
 * Batch = { start: number, end: number, winner: number }  (indices into scored[])
 * Frame = { thumbBlob: Blob, fullBlob: Blob, timeS: number, blurScore: number }
 */

import { Input, BlobSource, ALL_FORMATS, EncodedPacketSink, VideoSampleSink, CanvasSink } from 'mediabunny';

const THUMB = 64;    // sharpness scoring canvas (square)
const VIZ  = 80;    // display thumbnail sent to UI (square, cover-fit)
const MAX_W = 1920;
const MAX_H = 1080;

self.onmessage = async ({ data }) => {
  try {
    const { file, nFrames, startTime = 0, endTime = Infinity } = data;
    const frames = await run(file, nFrames, startTime, endTime);
    self.postMessage({ type: 'done', frames });
  } catch (e) {
    self.postMessage({ type: 'error', message: e.message });
  }
};

async function run(file, nFrames, startTime, endTime) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) throw new Error('No video track found');

  // Phase 1: collect keyframe timestamps within trim window
  const packetSink = new EncodedPacketSink(videoTrack);
  const keyTimestamps = [];
  let packet = startTime > 0
    ? await packetSink.getKeyPacket(startTime)
    : await packetSink.getFirstKeyPacket();
  while (packet && packet.timestamp <= endTime) {
    keyTimestamps.push(packet.timestamp);
    packet = await packetSink.getNextKeyPacket(packet);
  }
  if (keyTimestamps.length === 0) throw new Error('No keyframes found in the selected time range');
  self.postMessage({ type: 'total', count: keyTimestamps.length });

  // Phase 2: decode keyframes → Laplacian variance score + 80×80 viz thumbnail
  const scoreCanvas = new OffscreenCanvas(THUMB, THUMB);
  const scoreCtx   = scoreCanvas.getContext('2d', { willReadFrequently: true });
  const vizCanvas  = new OffscreenCanvas(VIZ, VIZ);
  const vizCtx     = vizCanvas.getContext('2d');
  const videoSink  = new VideoSampleSink(videoTrack);
  const scored     = [];
  let i = 0;

  for await (const sample of videoSink.samplesAtTimestamps(keyTimestamps)) {
    if (sample) {
      sample.draw(scoreCtx, 0, 0, THUMB, THUMB);
      sample.drawWithFit(vizCtx, { fit: 'cover' });
      const px    = scoreCtx.getImageData(0, 0, THUMB, THUMB).data;
      const score = laplacianVariance(px);
      scored.push({ timeS: sample.timestamp, score });
      sample.close();
      const thumbBlob = await vizCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.75 });
      self.postMessage({ type: 'frame-scored', index: i, timeS: sample.timestamp, score, thumbBlob });
    }
    i++;
  }
  if (scored.length === 0) throw new Error('No frames could be decoded');

  // Phase 3: batched selection
  const { selected, batches } = batchedSelect(scored, nFrames);
  self.postMessage({ type: 'selection', batches, selectedIndices: selected.map(f => f.index) });

  // Phase 4: re-decode selected frames at full resolution → blobs
  const fullSink   = new CanvasSink(videoTrack, { width: MAX_W, height: MAX_H, fit: 'contain' });
  const smallCanvas = new OffscreenCanvas(THUMB, THUMB);
  const smallCtx   = smallCanvas.getContext('2d');
  const frames     = [];

  for await (const wrapped of fullSink.canvasesAtTimestamps(selected.map(f => f.timeS))) {
    if (!wrapped) continue;
    const fullBlob  = await wrapped.canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
    smallCtx.drawImage(wrapped.canvas, 0, 0, THUMB, THUMB);
    const thumbBlob = await smallCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    const match = selected.find(f => Math.abs(f.timeS - wrapped.timestamp) < 0.001);
    frames.push({ thumbBlob, fullBlob, timeS: wrapped.timestamp, blurScore: match?.score ?? 0 });
  }

  input.dispose();
  return frames;
}

// Laplacian variance on 64×64 thumbnail — same formula as Sharp Frames Python + splat_pipeline.py
function laplacianVariance(data) {
  const w = THUMB, h = THUMB;
  const luma = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    luma[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const lap = luma[(y-1)*w+x] + luma[(y+1)*w+x] + luma[y*w+x-1] + luma[y*w+x+1] - 4 * luma[y*w+x];
      sum += lap; sumSq += lap * lap; n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

// Divide scored frames into `target` equal batches, pick sharpest from each.
// Returns both the selected frames and the batch structure (for UI visualization).
function batchedSelect(scored, target) {
  if (!scored.length) return { selected: [], batches: [] };
  const n        = Math.max(1, Math.min(target, scored.length));
  const batchSize = Math.ceil(scored.length / n);
  const selected = [];
  const batches  = [];

  for (let i = 0; i < scored.length; i += batchSize) {
    const end = Math.min(i + batchSize, scored.length);
    let bestJ = 0;
    for (let j = 1; j < end - i; j++) {
      if (scored[i + j].score > scored[i + bestJ].score) bestJ = j;
    }
    const winnerIdx = i + bestJ;
    batches.push({ start: i, end: end - 1, winner: winnerIdx });
    selected.push({ ...scored[winnerIdx], index: winnerIdx });
  }
  return { selected, batches };
}
