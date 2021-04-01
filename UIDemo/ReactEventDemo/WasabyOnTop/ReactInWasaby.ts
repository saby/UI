import { Control } from 'UIReact/UICore/Base';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactEventDemo/WasabyOnTop/ReactInWasaby';

export default class ReactInWasaby extends Control {
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
