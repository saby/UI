import { Control } from 'UICore/Base';
// @ts-ignore
import * as template from 'wml!UICore/ReactDemo/ReactEventDemo/WasabyOnTop/CustomEvent';

export default class CustomEvent extends Control {
    protected _template = template;

    count: number = 0;

    customEventHandler = () => {
        this.count++;
        this.forceUpdate();
    };
}
