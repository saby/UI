import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Compatible/Controller';

export default class Controller extends Control {
    protected _template: TemplateFunction = template;
    protected opts: object = {
        text: '123'
    };

    protected test(): void {
        console.log('Click!');
    }

    protected _afterMount(): void {
        setTimeout(() => {
            this.opts = {
                text: 'Хоба'
            };
        }, 2000);
    }
}
