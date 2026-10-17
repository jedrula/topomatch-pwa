/*
 * Ask the server to render the splat from one photo's solved pose.
 *
 * Extracted because two places need it and the constraint it encodes is easy
 * to get wrong: this runs gsplat on the SAME GPU as training. Firing several
 * at once is how five training runs were lost to contention, so callers render
 * strictly one at a time and never speculatively.
 *
 * The server answers `cached: true` when the render already existed, which is
 * what lets the frames page show a comparison instantly for frames that have
 * been rendered before and ask first for the ones that would cost GPU time.
 */
import { getGateway } from '../config/gateway.js';

export async function renderCompareView(jobId, view) {
  const gw = await getGateway();
  const res = await fetch(`${gw}/topowall/api/v1/video-to-splat/${jobId}/compare-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ view }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || `frame ${view} failed (${res.status})`);
  return { cached: !!body.cached };
}
