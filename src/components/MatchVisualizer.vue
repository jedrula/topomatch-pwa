<template>
  <div class="relative">
    <canvas ref="canvasRef" class="w-full rounded border border-gray-700" />
    <div class="mt-2 flex gap-4 text-xs text-gray-400">
      <span><span class="inline-block w-3 h-3 rounded-full bg-green-400 mr-1" />confidence ≥ 0.9</span>
      <span><span class="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1" />confidence ≥ 0.7</span>
      <span><span class="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1" />confidence ≥ 0.6</span>
      <span class="ml-auto">showing top {{ drawn }} / {{ matches.length }} matches</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  image1DataUrl: String,
  image2DataUrl: String,
  matches: { type: Array, default: () => [] },
  maxLines: { type: Number, default: 500 },
})

const canvasRef = ref(null)
const drawn = ref(0)

const DISPLAY_H = 700

function confidenceColor(c) {
  if (c >= 0.9) return 'rgba(74, 222, 128, 0.75)'
  if (c >= 0.7) return 'rgba(250, 204, 21, 0.75)'
  return 'rgba(251, 146, 60, 0.7)'
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function draw() {
  const canvas = canvasRef.value
  if (!canvas || !props.image1DataUrl || !props.image2DataUrl) return

  const [img1, img2] = await Promise.all([
    loadImage(props.image1DataUrl),
    loadImage(props.image2DataUrl),
  ])

  const s1 = DISPLAY_H / img1.naturalHeight
  const s2 = DISPLAY_H / img2.naturalHeight
  const w1 = img1.naturalWidth * s1
  const w2 = img2.naturalWidth * s2

  canvas.width = w1 + w2
  canvas.height = DISPLAY_H

  const ctx = canvas.getContext('2d')
  ctx.drawImage(img1, 0, 0, w1, DISPLAY_H)
  ctx.drawImage(img2, w1, 0, w2, DISPLAY_H)

  // separator
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w1, 0)
  ctx.lineTo(w1, DISPLAY_H)
  ctx.stroke()

  if (!props.matches.length) return

  const top = [...props.matches]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, props.maxLines)

  drawn.value = top.length
  ctx.lineWidth = 1

  for (const m of top) {
    const [x1, y1] = m.point1
    const [x2, y2] = m.point2

    const px1 = x1 * s1
    const py1 = y1 * s1
    const px2 = w1 + x2 * s2
    const py2 = y2 * s2

    const color = confidenceColor(m.confidence)
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(px1, py1)
    ctx.lineTo(px2, py2)
    ctx.stroke()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(px1, py1, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px2, py2, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

watch(
  () => [props.matches, props.image1DataUrl, props.image2DataUrl],
  draw,
  { deep: true }
)
onMounted(draw)
</script>
