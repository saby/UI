// @ts-ignore
import * as template from 'wml!ReactUnitTest/_condition/If';
import { assert } from 'chai';

const COUNT_IF_FALSE = 1;
const COUNT_IF_TRUE = 3;

describe('Check result of "if condition" in template', () => {
    it('Should return only one node when value false', () => {
        assert.equal(getTemplateResult(false).length, COUNT_IF_FALSE);
    });
    it('Should return three node when value true', () => {
        assert.equal(getTemplateResult(true).length, COUNT_IF_TRUE);
    });
});

function getTemplateResult(value: boolean): unknown[] {
    return template({value}, {}, undefined, true);
}
