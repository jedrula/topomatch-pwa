<template>
  <div>
    <button @click="toggleEdit">
      {{ editMode ? "Switch to View Mode" : "Switch to Edit Mode" }}
    </button>

    <v-stage
      :config="{ width: width, height: height }"
      @mousedown="handleStageClick"
    >
      <v-layer>

        <!-- Room -->
        <v-line
          :config="{
            points: room.points,
            closed: true,
            stroke: '#444',
            strokeWidth: 3
          }"
        />

        <!-- Sections -->
        <template v-for="section in sections" :key="section.id">
          <v-line
            :config="{
              points: section.points,
              closed: true,
              fill: section.color,
              opacity: 0.6,
              stroke: '#222',
              strokeWidth: 2
            }"
            @click="selectSection(section)"
          />

          <!-- Edit handles -->
          <template v-if="editMode">
            <v-circle
              v-for="(point, i) in getPoints(section.points)"
              :key="i"
              :config="{
                x: point.x,
                y: point.y,
                radius: 6,
                fill: 'white',
                stroke: 'black',
                strokeWidth: 2,
                draggable: true
              }"
              @dragmove="updatePoint(section, i, $event)"
            />
          </template>
        </template>

      </v-layer>
    </v-stage>
  </div>
</template>

<script setup>
import { ref } from "vue"

const width = 900
const height = 600
const editMode = ref(false)

const room = ref({
  points: [100, 100, 800, 100, 800, 500, 100, 500]
})

const sections = ref([
  {
    id: "A",
    color: "#7FB3D5",
    points: [120, 120, 400, 120, 400, 250, 120, 250]
  },
  {
    id: "B",
    color: "#F5B041",
    points: [420, 120, 780, 120, 780, 250, 420, 250]
  }
])

function toggleEdit() {
  editMode.value = !editMode.value
}

function getPoints(flatArray) {
  const points = []
  for (let i = 0; i < flatArray.length; i += 2) {
    points.push({ x: flatArray[i], y: flatArray[i + 1] })
  }
  return points
}

function updatePoint(section, index, event) {
  const pos = event.target.position()
  section.points[index * 2] = pos.x
  section.points[index * 2 + 1] = pos.y
}

function selectSection(section) {
  if (!editMode.value) {
    alert(`Clicked section ${section.id}`)
  }
}

function handleStageClick(e) {
  if (!editMode.value) return

  // Example: click empty space to create new rectangular section
  if (e.target === e.target.getStage()) {
    const pos = e.target.getStage().getPointerPosition()

    sections.value.push({
      id: `S${sections.value.length + 1}`,
      color: "#82E0AA",
      points: [
        pos.x,
        pos.y,
        pos.x + 150,
        pos.y,
        pos.x + 150,
        pos.y + 120,
        pos.x,
        pos.y + 120
      ]
    })
  }
}
</script>
