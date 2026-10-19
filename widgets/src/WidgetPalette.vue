<template>
  <v-card height="80vh">
    <v-card-title>Widgets</v-card-title>
    <v-list dense>
      <v-list-item
          v-for="w in available"
          :key="w.type"
          draggable="true"
          @dragstart="onDragStart($event, w.type)"
      >
        <v-list-item-content>{{ w.name }}</v-list-item-content>
      </v-list-item>

      <v-list-item v-if="available.length === 0"></v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
const props = defineProps({
  available: {type: Array, required: true}
})
const emit = defineEmits(['dragstart-widget'])

function onDragStart(e, type) {
  e.dataTransfer.setData('application/widget', type)
  // Дополнительно эмитируем событие, если нужно
  emit('dragstart-widget', type)
}
</script>
