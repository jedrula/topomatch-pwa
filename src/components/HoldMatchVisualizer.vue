<template>
  <div>
    <div class="flex gap-4 items-center mb-2 text-sm text-gray-300">
      <label class="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" v-model="showRawMatches" />
        Raw matches
      </label>
      <span class="text-xs text-gray-500 ml-auto">
        {{ mappedCount }} hold pairs · {{ unmappedCount }} unmatched holds in img1
        <span v-if="showRawMatches"> · {{ rawLinesCount }} raw lines</span>
      </span>
    </div>
    <canvas ref="canvasRef" class="w-full rounded border border-gray-700" />
    <div class="mt-2 flex gap-4 flex-wrap text-xs text-gray-400">
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded-sm inline-block" style="background:rgba(74,222,128,0.4);border:1.5px solid rgb(74,222,128)" />
        holds with matches
      </span>
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded-sm inline-block" style="background:rgba(156,163,175,0.2);border:1px solid rgba(156,163,175,0.5)" />
        unmatched holds
      </span>
      <span class="flex items-center gap-1">
        <span class="w-7 inline-block border-t-2 border-cyan-400" />
        mapped hold pair
      </span>
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded-full inline-block bg-orange-400" />
        cluster colours (img2)
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const DISPLAY_H = 700

// Palette for cluster colouring when server doesn't supply dominantColor
const CLUSTER_PALETTE = [
  '#f87171','#fb923c','#fbbf24','#a3e635','#34d399',
  '#22d3ee','#60a5fa','#a78bfa','#f472b6','#94a3b8',
]

const props = defineProps({
  image1DataUrl: String,
  image2DataUrl: String,
  holds1: { type: Array, default: () => [] },
  holds2: { type: Array, default: () => [] },
  clusters2: { type: Array, default: () => [] },
  /** Map<hold1Id, { hold1, hold2|null, matchCount, centroid }> (from holdMatcher.js) */
  holdMapping: { type: Object, default: null },
  /** Raw matches array from /general-matching response */
  matches: { type: Array, default: () => [] },
  maxRawLines: { type: Number, default: 300 },
  /** matchToDetectionScale for drawing match points on image — {x,y} */
  scale1: { type: Object, default: () => ({ x: 1, y: 1 }) },
  scale2: { type: Object, default: () => ({ x: 1, y: 1 }) },
})

const canvasRef = ref(null)
const showRawMatches = ref(false)
const mappedCount = ref(0)
const unmappedCount = ref(0)
const rawLinesCount = ref(0)

// ── SVG → Path2D ──────────────────────────────────────────────────────────────
const _svgParser = new DOMParser()

function _svgToPath2D(svgMarkup) {
  if (!svgMarkup) return null
  const sdoc = _svgParser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${svgMarkup}</svg>`,
    'image/svg+xml'
  )
  const el = sdoc.querySelector('path,circle,ellipse,rect,polygon')
  if (!el) return null
  const tag = el.tagName.toLowerCase()
  if (tag === 'circle') {
    const p = new Path2D()
    p.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, 2 * Math.PI)
    return p
  }
  if (tag === 'ellipse') {
    const p = new Path2D()
    p.ellipse(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('rx'), +el.getAttribute('ry'), 0, 0, 2 * Math.PI)
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

// ── drawing helpers ────────────────────────────────────────────────────────────

function drawHold(ctx, hold, fill, stroke, lineWidth) {
  let path = _svgToPath2D(hold.svgMarkup)
  if (!path) {
    path = new Path2D()
    path.rect(hold.x ?? 0, hold.y ?? 0, hold.width ?? 0, hold.height ?? 0)
  }
  ctx.fillStyle = fill
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.fill(path)
  ctx.stroke(path)
}

function buildClusterColorMap(clusters) {
  const map = new Map()
  clusters.forEach((c, i) => {
    const col = c.dominantColor || CLUSTER_PALETTE[i % CLUSTER_PALETTE.length]
    for (const id of (c.holdIds ?? [])) map.set(id, col)
  })
  return map
}

function holdCenter(hold, scaleX, scaleY, offsetX) {
  const cx = (hold.centerX ?? (hold.x + (hold.width ?? 0) / 2)) * scaleX + offsetX
  const cy = (hold.centerY ?? (hold.y + (hold.height ?? 0) / 2)) * scaleY
  return { cx, cy }
}

function loadImg(src) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

// ── main draw ──────────────────────────────────────────────────────────────────

async function draw() {
  const canvas = canvasRef.value
  if (!canvas || !props.image1DataUrl || !props.image2DataUrl) return

  const [img1, img2] = await Promise.all([
    loadImg(props.image1DataUrl),
    loadImg(props.image2DataUrl),
  ])

  // Display scale: fit both images to DISPLAY_H
  const ds1 = DISPLAY_H / img1.naturalHeight
  const ds2 = DISPLAY_H / img2.naturalHeight
  const w1 = img1.naturalWidth * ds1
  const w2 = img2.naturalWidth * ds2

  canvas.width = Math.round(w1 + w2)
  canvas.height = DISPLAY_H

  const ctx = canvas.getContext('2d')
  ctx.drawImage(img1, 0, 0, w1, DISPLAY_H)
  ctx.drawImage(img2, w1, 0, w2, DISPLAY_H)

  // separator
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(w1, 0); ctx.lineTo(w1, DISPLAY_H); ctx.stroke()

  const matchedSet = new Set(props.holdMapping ? [...props.holdMapping.keys()] : [])
  const clrMap = buildClusterColorMap(props.clusters2)

  // ── holds image 1
  // holds are in detection space; ds1 alone maps detection→display only when
  // detection dims == natural image dims (verified via coordinate logging).
  // If they diverge, holdMapping parent component already passed corrected scale in scale1.
  const totalHold1Scale = ds1 // detection→display (assumes detection == natural; else caller rescales)
  ctx.save()
  ctx.scale(totalHold1Scale, totalHold1Scale)
  for (const hold of props.holds1) {
    const hit = matchedSet.has(hold.id)
    drawHold(
      ctx, hold,
      hit ? 'rgba(74,222,128,0.35)' : 'rgba(156,163,175,0.15)',
      hit ? 'rgba(74,222,128,0.9)' : 'rgba(156,163,175,0.45)',
      1.5 / totalHold1Scale
    )
  }
  ctx.restore()

  // ── holds image 2
  const totalHold2Scale = ds2
  ctx.save()
  ctx.translate(w1, 0)
  ctx.scale(totalHold2Scale, totalHold2Scale)
  for (const hold of props.holds2) {
    const col = clrMap.get(hold.id) ?? clrMap.get(hold.holdId)
    drawHold(
      ctx, hold,
      col ? col + '44' : 'rgba(156,163,175,0.15)',
      col ?? 'rgba(156,163,175,0.45)',
      1.5 / totalHold2Scale
    )
  }
  ctx.restore()

  // ── raw match lines (optional)
  rawLinesCount.value = 0
  if (showRawMatches.value && props.matches.length) {
    const top = [...props.matches]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, props.maxRawLines)
    rawLinesCount.value = top.length
    ctx.lineWidth = 0.5
    for (const m of top) {
      // match points are in natural image space → apply ds (display scale)
      // If match space ≠ natural space, scale1/scale2 props correct it
      const x1 = m.point1[0] / props.scale1.x * ds1
      const y1 = m.point1[1] / props.scale1.y * ds1
      const x2 = w1 + m.point2[0] / props.scale2.x * ds2
      const y2 = m.point2[1] / props.scale2.y * ds2
      ctx.strokeStyle = m.confidence >= 0.9 ? 'rgba(74,222,128,0.2)' : 'rgba(250,204,21,0.15)'
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    }
  }

  // ── hold mapping lines
  let mapped = 0
  let unmapped = 0
  if (props.holdMapping) {
    for (const [, { hold1, hold2 }] of props.holdMapping) {
      if (!hold2) { unmapped++; continue }
      mapped++
      const { cx: cx1, cy: cy1 } = holdCenter(hold1, ds1, ds1, 0)
      const { cx: cx2, cy: cy2 } = holdCenter(hold2, ds2, ds2, w1)

      ctx.strokeStyle = 'rgba(34,211,238,0.9)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx1, cy1); ctx.lineTo(cx2, cy2); ctx.stroke()

      ctx.fillStyle = 'rgba(34,211,238,1)'
      ctx.beginPath(); ctx.arc(cx1, cy1, 4, 0, 2 * Math.PI); ctx.fill()
      ctx.beginPath(); ctx.arc(cx2, cy2, 4, 0, 2 * Math.PI); ctx.fill()
    }
  }
  mappedCount.value = mapped
  unmappedCount.value = unmapped
}

watch(
  () => [
    props.matches, props.image1DataUrl, props.image2DataUrl,
    props.holds1, props.holds2, props.holdMapping,
    props.clusters2, showRawMatches.value,
  ],
  draw,
  { deep: true }
)
onMounted(draw)
</script>
