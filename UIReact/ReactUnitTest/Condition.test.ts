// @ts-ignore
import * as template from 'wml!ReactUnitTest/_condition/If';
import {assert} from 'chai';
import {ReactElement} from 'react';

const COUNT_IF_FALSE = 1;
const COUNT_IF_TRUE = 3;
const NODES_TEXT = ['I', 'Am', 'Fine'];
const NODE_TYPE = 'div';

describe('Check result of "if condition" in template with false', () => {
    const templateResult = getTemplateResult(false);

    it('should return only one node', () => {
        assert.equal(templateResult.length, COUNT_IF_FALSE);
    });

    it('should be a div', () => {
        assert.equal(templateResult[0].type, NODE_TYPE);
    });

    it('should contain correct text', () => {
        assert.equal(templateResult[0].props.children, NODES_TEXT[1]);
    });
});


describe('Check result of "if condition" in template with true', () => {
    const templateResult = getTemplateResult(true);

    it('should return three node', () => {
        assert.equal(templateResult.length, COUNT_IF_TRUE);
    });

    it('should be a div', () => {
        templateResult.forEach((node, key) => {
            assert.equal(node.type, NODE_TYPE);
        });
    });

    it('should contain correct text', () => {
        templateResult.forEach((node, key) => {
            assert.equal(node.props.children, NODES_TEXT[key]);
        });
    });
});

function getTemplateResult(value: boolean): ReactElement[] {
    return template({value}, {}, undefined, true);
}
