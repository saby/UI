import { assert } from 'chai';
import { replace, restore, fake } from 'sinon';

import { IControlNode, IWasabyHTMLElement, TEventsObject } from 'UI/_vdom/Synchronizer/interfaces';
import { IProperties } from 'UI/_vdom/Synchronizer/resources/DOMEnvironment';

import { Hooks } from 'UI/Vdom';
import { constants } from 'Env/Env';

describe('UI/_vdom/Synchronizer/resources/Hooks', () => {
    before(() => {
        replace(constants, 'compat', false);
    });
    after(() => {
        restore();
    });
    describe('setControlNodeHook', () => {
        it('basic', () => {
            const tagName = 'div';
            const element = createMockElement(tagName);
            const controlNode = createMockControlNode();
            const props = {} as IProperties;
            const children = [];
            const id = 'inst_1';
            const ref = fake();

            const setControlNodeHookResult = Hooks.setControlNodeHook(tagName, props, children, id, controlNode, ref);

            assert.strictEqual(tagName, setControlNodeHookResult[0], 'вернулся другой tagName');
            assert.strictEqual(props, setControlNodeHookResult[1], 'вернулись другие props');
            assert.strictEqual(children, setControlNodeHookResult[2], 'вернулись другие children');
            assert.strictEqual(id, setControlNodeHookResult[3], 'вернулся другой id');

            const controlNodeRef = setControlNodeHookResult[4];
            controlNodeRef(element);
            assert.strictEqual(element.controlNodes[0], controlNode, 'mountRef не добавил controlNode в массив controlNodes элемента');
            assert.strictEqual(controlNode.control._container, element, 'mountRef не записал element в _container контрола');
            assert.ok(ref.calledOnce, 'mountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.firstCall.args[0], element, 'mountRef не передал element в оригинальный ref');

            controlNodeRef();
            assert.notOk(element.controlNodes.length, 'unmountRef не убрал controlNode из массива controlNodes элемента');
            assert.ok(ref.calledTwice, 'unmountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.secondCall.args[0], undefined, 'unmountRef передал неправильный аргумент в оригинальный ref');
        });
    });

    describe('setEventHook', () => {
        it('basic', () => {
            const tagName = 'div';
            const element = createMockElement(tagName);
            const controlNode = createMockControlNode();
            const props = {
                events: {
                    'on:event': [{}]
                },
            } as unknown as IProperties;
            const children = [];
            const id = 'inst_1';
            const ref = fake();

            const setEventHookResult = Hooks.setEventHook(tagName, props, children, id, controlNode, ref);

            assert.strictEqual(tagName, setEventHookResult[0], 'вернулся другой tagName');
            assert.strictEqual(props, setEventHookResult[1], 'вернулись другие props');
            assert.strictEqual(children, setEventHookResult[2], 'вернулись другие children');
            assert.strictEqual(id, setEventHookResult[3], 'вернулся другой id');

            const eventRef = setEventHookResult[4];
            eventRef(element);
            assert.strictEqual(element.eventPropertiesCnt, 1, 'mountRef не добавил событие в eventProperties элемента');
            assert.ok(element.eventProperties &&
                element.eventProperties['on:event'] &&
                element.eventProperties['on:event'][0] &&
                element.eventProperties['on:event'][0] === props.events['on:event'][0],
                'mountRef добавил что-то не то в eventProperties элемента');
            assert.ok(controlNode.environment.addCaptureEventHandler.calledOnce, 'mountRef не вызвал метод addCaptureEventHandler');
            assert.ok(ref.calledOnce, 'mountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.firstCall.args[0], element, 'mountRef не передал element в оригинальный ref');

            eventRef();
            assert.ok(element.eventProperties === undefined && element.eventPropertiesCnt === undefined, 'unmountRef не очистил eventProperties элемента');
            assert.ok(controlNode.environment.removeCaptureEventHandler.calledOnce, 'mountRef не вызвал метод removeCaptureEventHandler');
            assert.ok(ref.calledTwice, 'unmountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.secondCall.args[0], undefined, 'unmountRef передал неправильный аргумент в оригинальный ref');
        });
    });
});

class ControlNodeMock {
    control = {};
    environment = {
        addCaptureEventHandler: fake(),
        removeCaptureEventHandler: fake()
    };
}

class HTMLMockElement {
    controlNodes: IControlNode[] = [];
    eventProperties: TEventsObject = {};
    eventPropertiesCnt: number = 0;

    readonly type: string;

    constructor(type: string) {
        this.type = type.toUpperCase();
    }
}

function createMockControlNode(): IControlNode {
    return new ControlNodeMock() as unknown as IControlNode;
}

function createMockElement(type: string): IWasabyHTMLElement {
    return new HTMLMockElement(type) as unknown as IWasabyHTMLElement;
}
