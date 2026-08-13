/**
 * Frame extractor web worker — Mediabunny edition.
 *
 * Scoring mode (default):
 *   in:  { file, extractionFps?, startTime?, endTime? }
 *   out: { type: 'total', count }
 *        { type: 'frame-scored', index, timeS, score, thumbBlob }
 *        { type: 'done' }
 *        { type: 'error', message }
 *
 * Decode mode:
 *   in:  { mode: 'decode', file, timestamps: number[] }
 *   out: { type: 'done', frames: Frame[] }
 *        { type: 'error', message }
 *
 * Frame = { fullBlob: Blob, timeS: number, score: number }
 */

import { Input, BlobSource, ALL_FORMATS, VideoSampleSink, CanvasSink } from 'mediabunny';

const THUMB   = 64;
const VIZ     = 80;
const MAX_DIM = 1920;

self.onmessage = async ({ data }) => {
  if (data.mode === 'decode') {
    try {
      const frames = await decodeFrames(data.file, data.timestamps, data.scores ?? {});
      self.postMessage({ type: 'done', frames });
    } catch (e) {
      self.postMessage({ type: 'error', message: e.message });
    }
    return;
  }

  try {
    const { file, extractionFps = 10, startTime = 0, endTime = Infinity } = data;
    await scoreFrames(file, extractionFps, startTime, endTime);
    self.postMessage({ type: 'done' });
  } catch (e) {
    self.postMessage({ type: 'error', message: e.message });
  }
};

async function scoreFrames(file, extractionFps, startTime, endTime) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) throw new Error('No video track found');

  const metaDuration = await videoTrack.getDurationFromMetadata();
  if (metaDuration == null) throw new Error('Could not determine video duration');
  const clampEnd = Math.min(endTime === Infinity ? metaDuration : endTime, metaDuration);
  const step = 1 / Math.max(0.1, extractionFps);
  const timestamps = [];
  for (let t = startTime; t < clampEnd - step * 0.5; t += step) timestamps.push(t);
  if (timestamps.length === 0) throw new Error('No frames in the selected time range');
  self.postMessage({ type: 'total', count: timestamps.length });

  const scoreCanvas = new OffscreenCanvas(THUMB, THUMB);
  const scoreCtx   = scoreCanvas.getContext('2d', { willReadFrequently: true });
  const vizCanvas  = new OffscreenCanvas(VIZ, VIZ);
  const vizCtx     = vizCanvas.getContext('2d');
  const videoSink  = new VideoSampleSink(videoTrack);
  let i = 0, decoded = 0;

  for await (const sample of videoSink.samplesAtTimestamps(timestamps)) {
    if (sample) {
      sample.draw(scoreCtx, 0, 0, THUMB, THUMB);
      sample.drawWithFit(vizCtx, { fit: 'cover' });
      const px    = scoreCtx.getImageData(0, 0, THUMB, THUMB).data;
      const score = laplacianVariance(px);
      sample.close();
      const thumbBlob = await vizCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.75 });
      self.postMessage({ type: 'frame-scored', index: i, timeS: timestamps[i], score, thumbBlob });
      decoded++;
    }
    i++;
  }
  if (decoded === 0) throw new Error('No frames could be decoded');
  input.dispose();
}

async function decodeFrames(file, timestamps, scores) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) throw new Error('No video track found');

  // Cap the longer dimension at MAX_DIM, let the other scale proportionally — no letterboxing
  const [dw, dh] = await Promise.all([videoTrack.getDisplayWidth(), videoTrack.getDisplayHeight()]);
  const scale    = Math.min(1, MAX_DIM / Math.max(dw, dh));
  const sinkOpts = scale < 1 ? { width: Math.round(dw * scale), height: Math.round(dh * scale) } : {};

  const fullSink = new CanvasSink(videoTrack, sinkOpts);
  const frames = [];

  for await (const wrapped of fullSink.canvasesAtTimestamps(timestamps)) {
    if (!wrapped) continue;
    const fullBlob = await wrapped.canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
    frames.push({ fullBlob, timeS: wrapped.timestamp, score: scores[wrapped.timestamp] ?? 0 });
  }

  input.dispose();
  return frames;
}

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
