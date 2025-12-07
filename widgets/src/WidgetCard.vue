<template>
  <v-card style="width: 320px;">
    <v-toolbar dense flat>
      <v-toolbar-title class="text-subtitle-1">{{ widget.type }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon small @click="close">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card-text>
      <component :is="resolvedComponent" v-bind="widget.props" />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  widget: { type: Object, required: true },
  registry: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const resolvedComponent = computed(() => {
  return props.registry[props.widget.type] || 'div'
})

function close() {
  emit('close', props.widget.id)
}
</script>
