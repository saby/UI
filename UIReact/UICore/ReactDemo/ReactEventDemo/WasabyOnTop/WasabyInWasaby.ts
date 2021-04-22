import { Control } from 'UICore/Base';
// @ts-ignore
import * as template from 'wml!UICore/ReactDemo/ReactEventDemo/WasabyOnTop/WasabyInWasaby';

export default class WasabyInWasaby extends Control {
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
