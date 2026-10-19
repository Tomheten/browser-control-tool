import { createApp, h } from 'vue';
import App              from './WidgetsDashboard.vue';

// Vuetify
import { createVuetify } from 'vuetify';
// @ts-ignore
import 'vuetify/styles';
import * as components   from 'vuetify/components';
import * as directives   from 'vuetify/directives';

// @ts-ignore
import * as feather from 'feather-icons'

// TODO: add icons set
// Тема и иконки можно подключить по желанию
const vuetify = createVuetify({
    icons: {
        defaultSet: 'feather',
        sets: {
            feather: {
                component: (props: any) => {
                    const icon = feather.icons[props.icon]
                    if (!icon) return null
                    return h('span', {
                        innerHTML: icon.toSvg({width: 24, height: 24})
                    })
                }
            }
        }
    },
    components,
    directives,
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                dark: true,
                colors: {
                    background: '#121212',
                    surface: '#1E1E1E',
                    primary: '#BB86FC',
                    secondary: '#03DAC6',
                    error: '#CF6679',
                },
            },
            light: {
                dark: false,
                colors: {
                    background: '#FFFFFF',
                    surface: '#FFFFFF',
                    primary: '#1976D2',
                    secondary: '#424242',
                    error: '#FF5252',
                },
            },
        },
    },
});

createApp(App)
    .use(vuetify)
    .mount('#app');
