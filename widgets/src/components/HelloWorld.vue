<script setup lang="ts">

const headers = [
  {text: 'Имя', value: 'name'},
  {text: 'Возраст', value: 'age'},
];

const items = [
  {name: 'Иван', age: 25},
  {name: 'Мария', age: 30},
  {name: 'Алексей', age: 28},
];
</script>

<template>
  <v-container>
    <v-data-table
        :headers="headers"
        :items="items"
        item-value="name"
        show-expand
        class="elevation-1"
    >


    </v-data-table>
  </v-container>
</template>
