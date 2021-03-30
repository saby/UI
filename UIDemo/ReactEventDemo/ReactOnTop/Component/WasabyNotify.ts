import { Control } from 'UI/ReactComponent';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactEventDemo/ReactOnTop/Component/WasabyNotify';

export default class WasabyNotify extends Control {
    protected _template = template;
    _value = "";
    _valueCh = 0;

    _beforeMount(opts) {
        this._value = opts.value;
    }

    _beforeUpdate(newOpts) {
        // @ts-ignore
        if (newOpts.value !== this._options.value){
            this._value = newOpts.value;
        }
    }

    _handler() {
        this._valueCh += 1;
        this._notify('valueChanged', [this._value]);
    }
}
