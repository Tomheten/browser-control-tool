import { createApp } from 'vue';
import App           from './WidgetsDashboard.vue';

// Vuetify
import { createVuetify } from 'vuetify';
// @ts-ignore
import 'vuetify/styles';
import * as components   from 'vuetify/components';
import * as directives   from 'vuetify/directives';

// Тема и иконки можно подключить по желанию
const vuetify = createVuetify({
    components,
    directives,
});

createApp(App)
    .use(vuetify)
    .mount('#app');
