<template>
  <div
      class="canvas"
      @drop="onDrop"
      @dragover.prevent="onDragOver"
  >
    <div class="cards">
      <WidgetCard
          v-for="w in placed"
          :key="w.id"
          :widget="w"
          :registry="registry"
          @close="onCloseCard"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import WidgetCard from './WidgetCard.vue'

const props = defineProps({
  registry: {type: Object, required: true},
  placed: {type: Array, required: true}
})
const emit = defineEmits(['drop-widget', 'remove-widget'])

function onDragOver(e) {
}

function onDrop(e) {
  const type = e.dataTransfer.getData('application/widget')
  if (!type) return
  emit('drop-widget', type)
}

function onCloseCard(widgetId) {
  emit('remove-widget', widgetId)
}
</script>

<style>
.canvas {
  min-height: 60vh;
  border: 2px dashed #ccc;
  padding: 12px;
  border-radius: 6px;
}

.cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
