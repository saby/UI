import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/ContentOptions/Controller';

export default class LifecycleController extends Control {
    protected _template: TemplateFunction = template;
    protected value: number = 0;

    protected _afterMount(options: any, context?: object): void {
        // @ts-ignore
        (this._children.button as HTMLElement).addEventListener('click', () => {
            ++this.value;
            // @ts-ignore
            this._forceUpdate();
        });
    }
}
