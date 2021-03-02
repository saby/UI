import { Control } from 'UI/ReactComponent';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactEventDemo/WasabyOverReact/WasabyCounter';

export default class WasabyCounter extends Control {
    protected _template = template;

    count: number = 0;
    increment = () => {
        this.count++;
        this.forceUpdate();
    };

    decrement = () => {
        this.count--;
        this.forceUpdate();
    };
}
