<template>
  <div id="find-elems-root" class="find-elems-root">
    <h3 @click="console.log('addddddd')">{{ title }}</h3>
    <slot/>
  </div>
</template>

<script lang="ts" context="module">
// module-level exports — допустимы и попадут в сборку как named exports
export function findElems(selector: string): Element[] {
  return Array.from(document.querySelectorAll(selector));
}
</script>

<script lang="ts" setup>


//@ts-ignore
import {ref, onMounted} from 'vue';

interface Props {
  initialTitle?: string;
}

const props = defineProps<Props>();

const title = ref(props.initialTitle ?? 'Find Elems Widget');

onMounted(() => {
  // логика компонента
  // console.log('FindElems mounted');
});
</script>

<style scoped>
</style>
