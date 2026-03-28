/**
 * Hold matching utilities
 *
 * Maps raw feature match points (from /general-matching) to hold shapes using
 * precise SVG hit-testing via Path2D + isPointInPath, then infers hold-to-hold
 * correspondence between two images via centroid of matched points.
 *
 * Coordinate space assumptions:
 * - match.point1 / match.point2 → original image pixel space (same as what
 *   the server returns in response.image_dimensions)
 * - hold coords (x, y, centerX, centerY, svgMarkup) → detection image space
 *   (metadata.imageDimensions from Firestore holdDetections)
 *
 * If detection space ≠ match response space a matchToDetectionScale factor
 * can be passed to mapMatchesToHolds / computeHoldToHoldMapping.
 */

const _parser = new DOMParser()

function _svgMarkupToPath2D(svgMarkup) {
  if (!svgMarkup) return null
  const svgDoc = _parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${svgMarkup}</svg>`,
    'image/svg+xml'
  )
  const el = svgDoc.querySelector('path,circle,ellipse,rect,polygon')
  if (!el) return null

  const tag = el.tagName.toLowerCase()

  if (tag === 'circle') {
    const p = new Path2D()
    p.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, 2 * Math.PI)
    return p
  }
  if (tag === 'ellipse') {
    const p = new Path2D()
    p.ellipse(
      +el.getAttribute('cx'), +el.getAttribute('cy'),
      +el.getAttribute('rx'), +el.getAttribute('ry'),
      0, 0, 2 * Math.PI
    )
    return p
  }
  if (tag === 'rect') {
    const p = new Path2D()
    p.rect(+el.getAttribute('x'), +el.getAttribute('y'), +el.getAttribute('width'), +el.getAttribute('height'))
    return p
  }
  if (tag === 'polygon') {
    const nums = el.getAttribute('points').trim().split(/[\s,]+/).map(Number)
    const p = new Path2D()
    for (let i = 0; i < nums.length; i += 2) {
      i === 0 ? p.moveTo(nums[i], nums[i + 1]) : p.lineTo(nums[i], nums[i + 1])
    }
    p.closePath()
    return p
  }
  if (tag === 'path') {
    const d = el.getAttribute('d')
    return d ? new Path2D(d) : null
  }
  return null
}

function _holdToPath2D(hold) {
  const path = _svgMarkupToPath2D(hold.svgMarkup)
  if (path) return path
  // bbox fallback
  const p = new Path2D()
  p.rect(hold.x ?? 0, hold.y ?? 0, hold.width ?? 0, hold.height ?? 0)
  return p
}

function _makeHitCtx() {
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 2
  return c.getContext('2d')
}

function _holdCenter(hold) {
  return {
    x: hold.centerX ?? (hold.x + (hold.width ?? 0) / 2),
    y: hold.centerY ?? (hold.y + (hold.height ?? 0) / 2),
  }
}

/**
 * Map match point1 coordinates to holds in image 1 using precise SVG shape
 * hit-testing. Each feature point belongs to at most one hold.
 *
 * @param {Array}  matches              response.matches from /general-matching
 * @param {Array}  holds                aiHolds + manualHolds for image 1
 * @param {number} [matchToDetectionScaleX=1]  scale if match space ≠ hold detection space
 * @param {number} [matchToDetectionScaleY=1]
 * @returns {Map<holdId, { hold, matches[] }>}
 */
export function mapMatchesToHolds(matches, holds, matchToDetectionScaleX = 1, matchToDetectionScaleY = 1) {
  const holdPaths = holds.map(h => ({ hold: h, path: _holdToPath2D(h) }))
  const ctx = _makeHitCtx()
  const result = new Map()

  for (const match of matches) {
    const x = match.point1[0] * matchToDetectionScaleX
    const y = match.point1[1] * matchToDetectionScaleY
    for (const { hold, path } of holdPaths) {
      if (path && ctx.isPointInPath(path, x, y)) {
        if (!result.has(hold.id)) result.set(hold.id, { hold, matches: [] })
        result.get(hold.id).matches.push(match)
        break
      }
    }
  }

  return result
}

/**
 * For each matched hold1, find the best corresponding hold2 by:
 * 1. Computing the centroid of all point2 values belonging to this hold1
 * 2. Hit-testing the centroid against holds2 shapes
 * 3. Falling back to nearest hold2 center if no shape contains the centroid
 *
 * @param {Map}    holdMatchMap  result of mapMatchesToHolds
 * @param {Array}  holds2        holds for image 2
 * @param {number} [matchToDetectionScaleX=1]
 * @param {number} [matchToDetectionScaleY=1]
 * @returns {Map<hold1Id, { hold1, hold2|null, matchCount, centroid }>}
 */
export function computeHoldToHoldMapping(holdMatchMap, holds2, matchToDetectionScaleX = 1, matchToDetectionScaleY = 1) {
  const hold2Paths = holds2.map(h => ({ hold: h, path: _holdToPath2D(h) }))
  const ctx = _makeHitCtx()
  const result = new Map()

  for (const [holdId, { hold: hold1, matches }] of holdMatchMap) {
    const n = matches.length
    const sum = matches.reduce(
      (a, m) => ({ x: a.x + m.point2[0], y: a.y + m.point2[1] }),
      { x: 0, y: 0 }
    )
    const centroid = {
      x: (sum.x / n) * matchToDetectionScaleX,
      y: (sum.y / n) * matchToDetectionScaleY,
    }

    let hold2 = null
    for (const { hold, path } of hold2Paths) {
      if (path && ctx.isPointInPath(path, centroid.x, centroid.y)) {
        hold2 = hold
        break
      }
    }

    // Nearest-center fallback
    if (!hold2 && holds2.length > 0) {
      let minDist = Infinity
      for (const h of holds2) {
        const c = _holdCenter(h)
        const d = Math.hypot(c.x - centroid.x, c.y - centroid.y)
        if (d < minDist) { minDist = d; hold2 = h }
      }
    }

    result.set(holdId, { hold1, hold2, matchCount: n, centroid })
  }

  return result
}

/**
 * Compute the scale factors to convert from match coord space to hold detection space.
 * Returns {x: 1, y: 1} if both spaces are the same (common case for full-res detection).
 *
 * @param {Object} matchImageDims      response.image_dimensions.image1 {width, height}
 * @param {Object} detectionImageDims  metadata.imageDimensions from Firestore {width, height}
 */
export function computeMatchToDetectionScale(matchImageDims, detectionImageDims) {
  if (!matchImageDims || !detectionImageDims) return { x: 1, y: 1 }
  return {
    x: detectionImageDims.width / matchImageDims.width,
    y: detectionImageDims.height / matchImageDims.height,
  }
}
