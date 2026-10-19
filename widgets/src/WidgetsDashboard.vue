<template>
  <v-app>
    <v-container>
      <v-row>
        <v-col cols="12" class="d-flex align-center gap-4">
          <!-- Кнопка "Создать профиль" -->
          <v-btn size="small" color="secondary" @click="createProfile">
            create profile
          </v-btn>

          <!-- Выпадающий список профилей -->
          <v-select
              v-model="selectedProfile"
              :items="profiles"
              label="Profiles"
              variant="outlined"
              density="compact"
              style="max-width: 200px"
          />
          <!-- Кнопка "Save" -->
          <v-btn size="small" prepend-icon="save">save</v-btn>
        </v-col>

        <!--        <v-spacer/>-->
        <!--        <div>profile</div>-->
      </v-row>
    </v-container>
    <v-divider thickness="5"></v-divider>
    <v-container fluid>
      <v-row>
        <v-col cols="3">
          <WidgetPalette
              :available="availableWidgets"
              @dragstart-widget="onDragStartFromPalette"
          />
        </v-col>

        <v-col cols="9">
          <WidgetCanvas
              :registry="registry"
              :placed="placedWidgets"
              @drop-widget="onDropWidget"
              @remove-widget="onRemoveWidget"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script setup>
import { inject, provide, ref } from 'vue'
import WidgetPalette from './WidgetPalette.vue'
import WidgetCanvas from './WidgetCanvas.vue'
import NetworkWidget from './NetworkWidget.vue'
import { WIDGET_STORE_TOKEN, widgetsStoreFactory } from "./widget.store";

const store = widgetsStoreFactory();
provide(WIDGET_STORE_TOKEN, store);


/* Регистрируем доступные типы компонентов */
const registry = {
  SimpleWidget: NetworkWidget
}

/* Начальный список доступных виджетов (показывается в палете) */
const availableWidgets = ref([
  {type: 'NetworkWidget', name: 'network widget'}
])

/* Список размещённых виджетов на холсте */
const placedWidgets = ref([])

/* Обработчик dragstart, проксируемый из палеты (не обязателен, но оставлен для примера) */
function onDragStartFromPalette(type) {
  // В этом примере dragstart обрабатывается в палете напрямую через dataTransfer,
  // но мы оставляем хук на случай расширения логики.
  // Ничего не делаем здесь.
}

/* При drop — создаём виджет и удаляем его из availableWidgets */
function onDropWidget(type) {
  // Защита: если тип уже не доступен — игнорируем
  const idx = availableWidgets.value.findIndex(w => w.type === type)
  if (idx === -1) return

  // Создаём экземпляр виджета
  placedWidgets.value.push({
    id: Date.now() + Math.random(),
    type,
    props: {}
  })

  // Убираем из палеты
  availableWidgets.value.splice(idx, 1)
}

/* При удалении карточки — удаляем из placed и возвращаем в палету */
function onRemoveWidget(widgetId) {
  const idx = placedWidgets.value.findIndex(w => w.id === widgetId)
  if (idx === -1) return
  const [removed] = placedWidgets.value.splice(idx, 1)

  // Вернуть тип в палету (если там ещё нет такого типа)
  const exists = availableWidgets.value.some(w => w.type === removed.type)
  if (!exists) {
    // Можно вернуть с именем; в реальном приложении храните маппинг type->name
    const name = removed.type === 'NetworkWidget' ? 'network widget' : removed.type
    availableWidgets.value.push({type: removed.type, name})
  }
}
</script>
