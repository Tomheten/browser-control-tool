// import Comp        from './find-elems.vue';
import Comp        from './first-widget.vue';
// @ts-ignore
import {createApp} from 'vue';

const container = document.createElement('div');
container.id = 'find-elems-container';
document.body.prepend(container);
createApp(Comp, {}).mount(container);
