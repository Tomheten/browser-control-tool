<script setup lang="ts">
import { ref } from 'vue';

// import HelloWorld from './components/HelloWorld.vue'
//import HelloWorld from './components/HelloWorld.vue';

let browserPath = '';

function sendPath() {
  console.dirxml('dev_action browser_path ' + browserPath);
}

function onChange(path: string) {
  browserPath = path;
}

function runBrowser() {
  console.dirxml('dev_action run_browser ' + browserPath);
}

function addDiv() {
  console.dirxml('dev_action add_div');
}
</script>

<template>
  <v-text-field label="browser-path" @input="onChange($event.target.value)" />
  <v-btn @click="sendPath">send path</v-btn>
  <v-btn @click="runBrowser()">run browser</v-btn>
  <v-btn @click="addDiv()">add div</v-btn>

  <!--  <HelloWorld/>-->
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
