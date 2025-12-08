import type { InjectionKey } from "vue";

export type WidgetsData = {
    profile: any;
    widgets: { [name: string]: any };
}

export class WidgetsStore {
    saveData(widgetsData: WidgetsData) {
        // TODO: need mapper methods(from/to Dto)
        const data = JSON.stringify(widgetsData)
        console.dirxml('dev_action', 'widgets_data', data);
    }

}

export const WIDGET_STORE_TOKEN: InjectionKey<WidgetsStore> = Symbol('widgets_store');

export function widgetsStoreFactory(): WidgetsStore {
    return new WidgetsStore();
}