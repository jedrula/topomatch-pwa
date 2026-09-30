/*
  Load a pod's COLMAP reconstruction into the browser and answer questions about it.

  This is the Vue half of the cherry-pick from colmap-treasure-chest (see README.md there):
  its parsers came across unchanged, its zustand store did not.

  Why this exists at all, when /history already had a point-cloud button: a PLY is a picture
  of the reconstruction. This is the reconstruction — poses, tracks, and the pairwise match
  graph. When a capture folds, the point cloud looks fine and the match graph shows exactly
  which pairs welded two parts of the map together. Diagnosing that has meant hand-rolled
  Python against database.db every time; this puts it a click away.
*/
import { ref, shallowRef, computed } from 'vue'
import { parseCamerasBin, parseImagesBin, parsePoints3DBin } from './parse-bin'
import { parseCamerasTxt, parseImagesTxt, parsePoints3DTxt } from './parse-text'
import { parseDatabase } from './parse-db'
import { cameraCenter } from './geometry'

export function useColmap() {
  const cameras = shallowRef(new Map())
  const images = shallowRef(new Map())
  const points3D = shallowRef(new Map())
  const db = shallowRef(null)
  const loading = ref(false)
  const progress = ref('')
  const error = ref('')

  async function loadPod(apiBase, jobId) {
    loading.value = true
    error.value = ''
    progress.value = 'Listing files…'
    const base = String(apiBase).replace(/\/$/, '')
    const url = (n) => `${base}/api/v1/video-to-splat/${jobId}/colmap/${n}`
    try {
      const listRes = await fetch(`${base}/api/v1/video-to-splat/${jobId}/colmap`)
      if (!listRes.ok) throw new Error(`${listRes.status} listing COLMAP files`)
      const { files } = await listRes.json()
      if (!files?.length) throw new Error('This pod has no COLMAP artefacts')
      const have = new Set(files.map((f) => f.name))
      const bytes = Object.fromEntries(files.map((f) => [f.name, f.bytes]))

      const grab = async (name) => {
        progress.value = `${name} (${(bytes[name] / 1e6).toFixed(1)} MB)…`
        const r = await fetch(url(name))
        if (!r.ok) throw new Error(`${r.status} fetching ${name}`)
        return r.arrayBuffer()
      }

      if (have.has('cameras.bin') && have.has('images.bin') && have.has('points3D.bin')) {
        cameras.value = parseCamerasBin(await grab('cameras.bin'))
        // Image ids and names come from a JSON summary, not from images.bin. That file
        // stores every 2-D observation of every image — 273 MB on a 1,244-frame capture —
        // and the panels use it for names and a count. Track lengths, which are the number
        // that matters, live in points3D.bin. Downloading a quarter of a gigabyte over the
        // tunnel to read a list of filenames made the panel take a minute to appear.
        progress.value = 'image list…'
        const sum = await fetch(`${base}/api/v1/video-to-splat/${jobId}/colmap/summary`)
        if (sum.ok) {
          const { images: list } = await sum.json()
          images.value = new Map(list.map((i) => [i.id, {
            imageId: i.id, name: i.name,
            qw: i.qw, qx: i.qx, qy: i.qy, qz: i.qz, tx: i.tx, ty: i.ty, tz: i.tz,
          }]))
        } else {
          images.value = parseImagesBin(await grab('images.bin'))
        }
        points3D.value = parsePoints3DBin(await grab('points3D.bin'))
      } else if (have.has('cameras.txt')) {
        const dec = new TextDecoder()
        cameras.value = parseCamerasTxt(dec.decode(await grab('cameras.txt')))
        images.value = parseImagesTxt(dec.decode(await grab('images.txt')))
        points3D.value = parsePoints3DTxt(dec.decode(await grab('points3D.txt')))
      } else {
        throw new Error('No cameras/images/points3D in this pod')
      }

      // The database is the expensive one and the interesting one: a 1.3 GB file on a big
      // capture. Fetched last so the scene is usable while it lands, and failure here is not
      // fatal — poses and points still render without it.
      if (have.has('database.db')) {
        try {
          db.value = await parseDatabase(await grab('database.db'))
        } catch (e) {
          error.value = `Match graph unavailable: ${e.message}`
        }
      }
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
      progress.value = ''
    }
  }

  const stats = computed(() => {
    const pts = points3D.value
    if (!images.value.size) return null
    let obs = 0
    let err = 0
    let n = 0
    for (const p of pts.values()) {
      obs += p.track?.length || 0
      if (p.error != null) {
        err += p.error
        n++
      }
    }
    return {
      images: images.value.size,
      cameras: cameras.value.size,
      points: pts.size,
      meanTrack: pts.size ? obs / pts.size : 0,
      meanReproj: n ? err / n : null,
      obsPerImage: images.value.size ? obs / images.value.size : 0,
    }
  })

  /* The pairwise match graph, which is the thing a point cloud cannot show.

     Reported as verified inliers per pair (two_view_geometries), not raw matches: raw counts
     include everything the matcher proposed, and the question is always how many survived
     geometric verification. On our own captures the median has run 25-870 depending on how
     far apart the cameras were, and a pair carrying 150+ inliers between cameras that cannot
     physically see the same thing is exactly what welds a map into a fold. */
  const covisibility = computed(() => {
    if (!db.value?.matchPairs?.length) return null
    const rows = []
    for (const m of db.value.matchPairs) {
      // isGeometric means `matches` holds the VERIFIED set; otherwise it is the raw
      // putative one, which answers a different and much weaker question.
      if (!m.isGeometric || !m.matches?.length) continue
      rows.push({ id1: m.imageId1, id2: m.imageId2, inliers: m.matches.length,
                  raw: m.numRawMatches ?? null })
    }
    rows.sort((a, b) => b.inliers - a.inliers)
    const counts = new Map()
    for (const r of rows) {
      counts.set(r.id1, (counts.get(r.id1) || 0) + 1)
      counts.set(r.id2, (counts.get(r.id2) || 0) + 1)
    }
    const inl = rows.map((r) => r.inliers).sort((a, b) => a - b)
    const pct = (q) => (inl.length ? inl[Math.floor(q * (inl.length - 1))] : 0)
    // Images with very few verified partners are where a reconstruction comes apart: on
    // b36e3755, frames 250-449 had 6-8 pairs each against 31-58 elsewhere, and GLOMAP put
    // that stretch 13.6 m out of place.
    const thin = [...counts.entries()]
      .filter(([, c]) => c < 10)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 40)
    return {
      pairs: rows.length,
      median: pct(0.5),
      p10: pct(0.1),
      p90: pct(0.9),
      weak: rows.filter((r) => r.inliers < 150).length,
      partnersByImage: counts,
      thin,
      rows,
    }
  })

  /* Where every camera ended up, for the 3D view. */
  const centers = computed(() => {
    const out = []
    for (const im of images.value.values()) {
      const c = cameraCenter(im)
      out.push({ id: im.imageId, name: im.name, x: c[0], y: c[1], z: c[2] })
    }
    return out
  })

  return { cameras, images, points3D, db, loading, progress, error,
           loadPod, stats, covisibility, centers }
}
