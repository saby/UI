import {RecordSet} from 'Types/collection';
import {Model, Record} from 'Types/entity';
import {Control} from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';
// @ts-ignore
import * as template from 'wml!UICore/ReactDemo/WasabyReactivity/Rec';

export default class Rec extends Control {
    protected _template: TemplateFunction = template;
    protected _text: String = '';
    protected _rs: RecordSet = new RecordSet<Record>();
    protected _rec: Record = Record.fromObject({
        count: 0
    });

    constructor(...args: [object]) {
        super(...args);
        this._incrementRec = this._incrementRec.bind(this);
        this._decrementRec = this._decrementRec.bind(this);
        this._addInRS = this._addInRS.bind(this);
        this._textChange = this._textChange.bind(this);
    }

    protected _afterMount(options?: {}, context?: object): void {
        (this._children.increment as HTMLElement).addEventListener('click', this._incrementRec);
        (this._children.decrement as HTMLElement).addEventListener('click', this._decrementRec);
        (this._children.add as HTMLElement).addEventListener('click', this._addInRS);
        (this._children.text as HTMLElement).addEventListener('input', this._textChange);
    }

    protected _beforeUnmount(): void {
        super._beforeUnmount();
        (this._children.increment as HTMLElement).removeEventListener('click', this._incrementRec);
        (this._children.decrement as HTMLElement).removeEventListener('click', this._decrementRec);
        (this._children.add as HTMLElement).removeEventListener('click', this._addInRS);
        (this._children.text as HTMLElement).removeEventListener('input', this._textChange);
    }

    _incrementRec(): void {
        this._rec.set({
            count: this._rec.get('count') + 1
        });
    }

    _decrementRec(): void {
        this._rec.set({
            count: this._rec.get('count') - 1
        });
    }

    _addInRS(): void {
        this._rs.add(Model.fromObject({
            text: this._text
        }));
        this._text = '';
    }

    _textChange(e: Event): void {
        this._text = (e.target as HTMLInputElement).value;
    }
}
