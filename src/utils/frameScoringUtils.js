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
