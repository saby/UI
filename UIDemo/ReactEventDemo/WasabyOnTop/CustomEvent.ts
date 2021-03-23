import { Control } from 'UI/ReactComponent';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactEventDemo/WasabyOnTop/CustomEvent';

export default class CustomEvent extends Control {
    protected _template = template;

    count: number = 0;

    customEventHandler = () => {
        this.count++;
        this.forceUpdate();
    };
}
