/**
 * Spatial splitting of draft boulder problem clusters.
 *
 * A single color cluster returned by the server can contain holds from
 * multiple distinct lines (e.g. two parallel routes of the same color).
 * This module detects disconnected spatial groups within a flat hold array
 * and returns them as separate sub-groups, each suitable for its own
 * boulder problem.
 *
 * Algorithm — MST + Tukey fence outlier detection
 * ------------------------------------------------
 * 1. Build the Minimum Spanning Tree of holds (Kruskal's).
 * 2. Compute the Tukey fence on MST edge lengths: Q3 + 1.5 × IQR.
 * 3. Remove MST edges that exceed the fence — they are true gaps, not dynos.
 * 4. Return connected components of the pruned MST.
 *
 * Why MST beats median×multiplier:
 * - Self-calibrating: each cluster adapts to its own density.
 * - Dynos are long edges but still within the distribution → fence stays above them.
 * - Inter-problem gaps are statistical outliers → reliably above the fence.
 * - When many dynos exist the fence shifts up automatically.
 */

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Returns the centre of a hold.
 * Accepts both SimpleHold (centerX/centerY) and BaseHold (x+width/2).
 *
 * @param {object} hold
 * @returns {{ x: number, y: number }}
 */
function getHoldCenter(hold) {
  if (hold.centerX !== undefined && hold.centerY !== undefined) {
    return { x: hold.centerX, y: hold.centerY };
  }
  return {
    x: hold.x + (hold.width ?? 0) / 2,
    y: hold.y + (hold.height ?? 0) / 2,
  };
}

/**
 * Euclidean distance between two centre points.
 *
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ---------------------------------------------------------------------------
// Kruskal's MST (union-find)
// ---------------------------------------------------------------------------

function makeUnionFind(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank[ra]++; }
    return true;
  }
  return { find, union };
}

/**
 * Builds the MST of `holds` and returns its edges sorted by length.
 *
 * @param {object[]} holds
 * @returns {{ i: number, j: number, d: number }[]}
 */
function buildMST(holds) {
  const centers = holds.map(getHoldCenter);

  // Collect all pairwise edges
  const edges = [];
  for (let i = 0; i < holds.length; i++) {
    for (let j = i + 1; j < holds.length; j++) {
      edges.push({ i, j, d: dist(centers[i], centers[j]) });
    }
  }
  edges.sort((a, b) => a.d - b.d);

  const uf = makeUnionFind(holds.length);
  const mst = [];
  for (const edge of edges) {
    if (uf.union(edge.i, edge.j)) {
      mst.push(edge);
      if (mst.length === holds.length - 1) break;
    }
  }
  return mst;
}

// ---------------------------------------------------------------------------
// Tukey fence outlier detection
// ---------------------------------------------------------------------------

/**
 * Returns the Tukey outer fence cutoff for an array of values.
 * Values above Q3 + fenceK × IQR are considered outliers.
 *
 * @param {number[]} values  - already sorted ascending
 * @param {number}  [fenceK=1.5]
 * @returns {number}
 */
function tukeyFence(values, fenceK = 1.5) {
  const n = values.length;
  const q1 = values[Math.floor(n * 0.25)];
  const q3 = values[Math.floor(n * 0.75)];
  return q3 + fenceK * (q3 - q1);
}

// ---------------------------------------------------------------------------
// Connected components on a pruned edge set (BFS)
// ---------------------------------------------------------------------------

/**
 * @param {object[]} holds
 * @param {{ i: number, j: number }[]} edges  - subset of edges to traverse
 * @returns {object[][]}
 */
function componentsFromEdges(holds, edges) {
  // Build adjacency list
  const adj = Array.from({ length: holds.length }, () => []);
  for (const { i, j } of edges) {
    adj[i].push(j);
    adj[j].push(i);
  }

  const visited = new Array(holds.length).fill(false);
  const groups = [];

  for (let start = 0; start < holds.length; start++) {
    if (visited[start]) continue;
    const group = [];
    const queue = [start];
    visited[start] = true;
    let qi = 0;
    while (qi < queue.length) {
      const cur = queue[qi++];
      group.push(holds[cur]);
      for (const nb of adj[cur]) {
        if (!visited[nb]) {
          visited[nb] = true;
          queue.push(nb);
        }
      }
    }
    groups.push(group);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Splits a flat array of holds into spatially-distinct groups using
 * MST + Tukey fence outlier detection.
 *
 * @param {object[]} holds
 * @param {object}   [opts]
 * @param {number}   [opts.fenceK=1.5]  - Tukey multiplier (higher = less splitting)
 * @returns {object[][]}
 */
export function splitHoldsByProximity(holds, { fenceK = 1.5 } = {}) {
  if (holds.length < 2) return [holds];

  const mst = buildMST(holds);
  if (mst.length === 0) return [holds];

  const lengths = mst.map(e => e.d).sort((a, b) => a - b);
  const cutoff = tukeyFence(lengths, fenceK);
  const keptEdges = mst.filter(e => e.d <= cutoff);

  return componentsFromEdges(holds, keptEdges);
}

/**
 * Analyses a draft cluster's holds and returns split metadata.
 *
 * @param {object[]} holds
 * @param {object}   [opts]  - forwarded to splitHoldsByProximity
 * @returns {{ needsSplit: boolean, groups: object[][] }}
 */
export function analyzeDraftCluster(holds, opts = {}) {
  const groups = splitHoldsByProximity(holds, opts);
  return {
    needsSplit: groups.length > 1,
    groups,
  };
}
