export function batchedSelectMain(frames, bs, bb) {
  if (!frames.length) return [];
  bs = Math.max(1, bs);
  bb = Math.max(0, bb);
  const stride = bs + bb;
  const selected = [];
  for (let i = 0; i < frames.length; i += stride) {
    const end = Math.min(i + bs, frames.length);
    let bestJ = 0;
    for (let j = 1; j < end - i; j++) {
      if (frames[i + j].score > frames[i + bestJ].score) bestJ = j;
    }
    selected.push(frames[i + bestJ]);
  }
  return selected;
}

export function formatTime(s) {
  if (s == null || isNaN(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return m > 0 ? `${m}:${sec.padStart(4, '0')}` : `${sec}s`;
}

// batchedSelectMain picks the sharpest frame in each batch, but "sharpest of a bad batch" can
// still be too soft to train on. This drops those, and reports how many went, so the count can
// be shown next to the selection total.
//
// The filter runs AFTER batching, not before. bb ("frames skipped between groups") is temporal
// spacing, so thinning the pool first would shift every batch boundary and leave the buffer
// counting positions in a filtered array rather than frames in the video.
//
// minSharpness is a percentage of the strip's own best frame — the control is labelled
// "% of strip max" and VideoStrip renders each frame on that same 0-100 scale. Relative rather
// than absolute means a uniformly soft strip still yields its sharpest frames instead of
// silently selecting nothing.
export function batchedSelectWithThreshold(frames, bs, bb, minSharpness = 0) {
  const selected = batchedSelectMain(frames, bs, bb);
  if (!minSharpness || !selected.length) return { selected, removedCount: 0 };

  const max = frames.reduce((m, f) => Math.max(m, f.score ?? 0), 0);
  if (max <= 0) return { selected, removedCount: 0 };

  const kept = selected.filter(f => ((f.score ?? 0) / max) * 100 >= minSharpness);
  return { selected: kept, removedCount: selected.length - kept.length };
}
