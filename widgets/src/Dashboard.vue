<template>
  <v-app>
    <v-container>
      <v-row>
        <v-col cols="12" class="d-flex align-center gap-4">
          <v-btn size="small" color="secondary" @click="createProfile">
            create profile
          </v-btn>

          <v-select
            v-model="selectedProfile"
            :items="profiles"
            label="Profiles"
            variant="outlined"
            density="compact"
            style="max-width: 200px"
          />
          <v-btn size="small" prepend-icon="save">save</v-btn>
        </v-col>

        <!--        <v-spacer/>-->
        <!--        <div>profile</div>-->
      </v-row>
    </v-container>
    <v-divider thickness="5"></v-divider>
  </v-app>
</template>

<script setup>
import { inject, provide, ref } from 'vue';
</script>
