import { Control, TemplateFunction } from 'UI/Base';
import {RecordSet} from 'Types/collection';
import {Record as EntityRecord} from 'Types/entity';
import template = require('wml!UIDemo/AsyncDemo/_index/LoopInternalOptions/LoopInternalOptions');

export default class LoopInternalOptions extends Control {
    protected _template: TemplateFunction = template;
    protected _informers: RecordSet;

    protected _beforeMount(): void {
        this._informers = LoopInternalOptions._getInformers();
    }

    private static _getInformers(): RecordSet {
        return new RecordSet({
            keyProperty: 'id',
            rawData: [{
                id: 1,
                template: 'UIDemo/AsyncDemo/_index/LoopInternalOptions/Item',
                data: new EntityRecord({
                    rawData: {field: true }
                }),
                property: true
            }, {
                id: 2,
                template: 'UIDemo/AsyncDemo/_index/LoopInternalOptions/Item',
                data: new EntityRecord({
                    rawData: {field: true }
                }),
                property: true
            }]
        });
    }

    changeTemplateOptions(): void {
        const item = this._informers.getRecordById(1);
        item.set('property', !item.get('property'));
    }

    changeInternalOptions(): void {
        const item = this._informers.getRecordById(1);
        item.set('data', new EntityRecord({
            rawData: {field: !item.get('data').get('field')}
        }));
    }
}
