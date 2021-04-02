import { Control } from 'UIReact/UICore/Base';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactEventDemo/ReactOnTop/Component/WasabyNotifier';


export default class WasabyNotifier extends Control {
    protected _template = template;
    _value = "";

    _beforeMount(opts) {
        this._value = opts.value;
    }

    _beforeUpdate(newOpts) {
        // @ts-ignore
        if (newOpts.value !== this._options.value){
            this._value = newOpts.value;
        }
    }

    _inputCompletedHandler() {
        this._notify('valueChanged', [this._value]);
    }
}
