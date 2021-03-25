import {RecordSet} from 'Types/collection';
import {Model, Record} from 'Types/entity';
import {Control, TemplateFunction} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/WasabyReactivity/Rec';
import {SyntheticEvent} from "UI/Vdom";

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
        this._removeInRS = this._removeInRS.bind(this);
        this._editInRS = this._editInRS.bind(this);
        this._textChange = this._textChange.bind(this);
    }

    _incrementRec() {
        this._rec.set({
            count: this._rec.get('count') + 1
        });
    }

    _decrementRec() {
        this._rec.set({
            count: this._rec.get('count') - 1
        });
    }

    _addInRS() {
        this._rs.add(Model.fromObject({
            text: this._text
        }));
        this._text = '';
    }

    _removeInRS(e) {
        this._rs.removeAt(+e.target.id);
    }

    _editInRS(e) {
        this._rs.at(+e.target.id).set({
            text: this._text || 'Edited'
        });
    }

    _textChange(e: SyntheticEvent<InputEvent>) {
        this._text = (e.target as HTMLInputElement).value;
    }
}
