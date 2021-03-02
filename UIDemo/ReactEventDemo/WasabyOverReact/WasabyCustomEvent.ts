import { Control } from 'UI/ReactComponent';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactEventDemo/WasabyOverReact/WasabyCustomEvent';

export default class WasabyCustomEvent extends Control {
    protected _template = template;

    simpleHandler = () => {
        alert('simple handler was called');
    };
}
