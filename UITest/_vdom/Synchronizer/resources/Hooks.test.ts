import { assert } from 'chai';
import { replace, restore, fake } from 'sinon';

import { IControlNode, IWasabyHTMLElement, TEventsObject, IEvent, IProperties } from 'UICore/_vdom/Synchronizer/interfaces';
import { invisibleNodeTagName } from 'UI/Executor';
import { TWasabyInputElement, TRef } from 'UICore/_vdom/Synchronizer/resources/Hooks';

import { Hooks } from 'UI/Vdom';
import { constants } from 'Env/Env';

const globalEnvironment = {
    eventSystem: {
        addCaptureEventHandler: fake(),
        removeCaptureEventHandler: fake()
    }
};

describe('UICore/_vdom/Synchronizer/resources/Hooks', () => {
    before(() => {
        replace(constants, 'compat', false);
    });

    after(() => {
        restore();
    });

    afterEach(() => {
        globalEnvironment.eventSystem.addCaptureEventHandler = fake();
        globalEnvironment.eventSystem.removeCaptureEventHandler = fake();
    });

    describe('setControlNodeHook', () => {
        it('basic', () => {
            const tagName = 'div';
            const element = createMockElement(tagName);
            const id = 'inst_1';
            const controlNode = createMockControlNode(id);
            const props = {} as IProperties;
            const children = [];
            const ref = fake();

            const setControlNodeHookResult = Hooks.setControlNodeHook(tagName, props, children, id, controlNode, ref);

            assert.strictEqual(setControlNodeHookResult[0], tagName, 'вернулся другой tagName');
            assert.strictEqual(setControlNodeHookResult[1], props, 'вернулись другие props');
            assert.strictEqual(setControlNodeHookResult[2], children, 'вернулись другие children');
            assert.strictEqual(setControlNodeHookResult[3], id, 'вернулся другой id');

            const controlNodeRef = setControlNodeHookResult[4];
            controlNodeRef(element);
            assert.strictEqual(element.controlNodes[0], controlNode, 'mountRef не добавил controlNode в массив controlNodes элемента');
            assert.strictEqual((controlNode.control as any)._container, element, 'mountRef не записал element в _container контрола');
            assert.ok(ref.calledOnce, 'mountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.firstCall.args[0], element, 'mountRef не передал element в оригинальный ref');

            controlNodeRef();
            assert.notOk(element.controlNodes.length, 'unmountRef не убрал controlNode из массива controlNodes элемента');
            assert.ok(ref.calledTwice, 'unmountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.secondCall.args[0], undefined, 'unmountRef передал неправильный аргумент в оригинальный ref');
        });

        it('invisible node with events', () => {
            const tagName = 'div';
            const element = createMockElement(tagName);
            const events: TEventsObject = {
                'on:event': [{} as IEvent]
            }
            const id = 'inst_1';
            const controlNode = createMockControlNode(id, invisibleNodeTagName, events);
            const props = {} as IProperties;
            const children = [];

            const controlNodeRef = Hooks.setControlNodeHook(tagName, props, children, id, controlNode)[4];
            controlNodeRef(element);
            assert.ok(element.eventProperties &&
                element.eventProperties['on:event'] &&
                element.eventProperties['on:event'][0] &&
                element.eventProperties['on:event'][0] === events['on:event'][0],
                'mountRef добавил что-то не то в eventProperties элемента');
            assert.ok(globalEnvironment.eventSystem.addCaptureEventHandler.calledOnce, 'mountRef не вызвал метод addCaptureEventHandler');

            controlNodeRef();
            assert.ok(element.eventProperties === undefined && element.eventPropertiesCnt === undefined, 'unmountRef не очистил eventProperties элемента');
            assert.ok(globalEnvironment.eventSystem.removeCaptureEventHandler.calledOnce, 'unmountRef не вызвал метод removeCaptureEventHandler');
        });

        it('invisible node without events', () => {
            const tagName = 'div';
            const element = createMockElement(tagName);
            const controlNode = createMockControlNode(invisibleNodeTagName);
            const props = {} as IProperties;
            const children = [];
            const id = 'inst_1';

            const controlNodeRef = Hooks.setControlNodeHook(tagName, props, children, id, controlNode)[4];
            controlNodeRef(element);
            assert.ok(globalEnvironment.eventSystem.addCaptureEventHandler.notCalled, 'mountRef вызвал метод addCaptureEventHandler несмотря на отсутствие событий');

            controlNodeRef();
            assert.ok(globalEnvironment.eventSystem.removeCaptureEventHandler.notCalled, 'unmountRef вызвал метод removeCaptureEventHandler несмотря на отсутствие событий');
        });

        it('add control nodes sorted', () => {
            const tagName = 'div';
            const element = createMockElement(tagName);
            const ids = ['inst_10', 'inst_11', 'inst_9', 'inst_3', 'inst_27'];
            const controlNodes = ids.map(id => createMockControlNode(id));
            const propsArray = ids.map(() => ({} as IProperties));
            let ref: TRef;
            for (let i = 0; i < ids.length; i++) {
                ref = Hooks.setControlNodeHook(tagName, propsArray[i], [], ids[i], controlNodes[i], ref)[4];
            }
            ref(element);

            const resultControlNodes = element.controlNodes;
            const expectedOrder = ['inst_27', 'inst_11', 'inst_10', 'inst_9', 'inst_3'];

            assert.equal(resultControlNodes.length, expectedOrder.length, 'после вызова mountRef неверное количество нод на элементе');
            for (let i = 0; i < resultControlNodes.length; i++) {
                assert.equal(resultControlNodes[i].id, expectedOrder[i], 'после вызова mountRef неверный порядок нод на элементе');
            }
        });
    });

    describe('setEventHook', () => {
        it('basic', () => {
            const tagName = 'div';
            const element = createMockElement(tagName);
            const id = 'inst_1';
            const controlNode = createMockControlNode(id);
            const props = {
                events: {
                    'on:event': [{}]
                }
            } as unknown as IProperties;
            const children = [];
            const ref = fake();

            const setEventHookResult = Hooks.setEventHook(tagName, props, children, id, controlNode, ref);

            assert.strictEqual(setEventHookResult[0], tagName, 'вернулся другой tagName');
            assert.strictEqual(setEventHookResult[1], props, 'вернулись другие props');
            assert.strictEqual(setEventHookResult[2], children, 'вернулись другие children');
            assert.strictEqual(setEventHookResult[3], id, 'вернулся другой id');

            const eventRef = setEventHookResult[4];
            eventRef(element);
            assert.strictEqual(element.eventPropertiesCnt, 1, 'mountRef не добавил событие в eventProperties элемента');
            assert.ok(element.eventProperties &&
                element.eventProperties['on:event'] &&
                element.eventProperties['on:event'][0] &&
                element.eventProperties['on:event'][0] === props.events['on:event'][0],
                'mountRef добавил что-то не то в eventProperties элемента');
            assert.ok(globalEnvironment.eventSystem.addCaptureEventHandler.calledOnce, 'mountRef не вызвал метод addCaptureEventHandler');
            assert.ok(ref.calledOnce, 'mountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.firstCall.args[0], element, 'mountRef не передал element в оригинальный ref');

            eventRef();
            assert.ok(element.eventProperties === undefined && element.eventPropertiesCnt === undefined, 'unmountRef не очистил eventProperties элемента');
            assert.ok(globalEnvironment.eventSystem.removeCaptureEventHandler.calledOnce, 'unmountRef не вызвал метод removeCaptureEventHandler');
            assert.ok(ref.calledTwice, 'unmountRef не вызвал оригинальный ref или вызвал его дважды');
            assert.strictEqual(ref.secondCall.args[0], undefined, 'unmountRef передал неправильный аргумент в оригинальный ref');
        });

        it('without events', () => {
            const tagName = 'div';
            const id = 'inst_1';
            const controlNode = createMockControlNode(id);
            const propsWithoutEvents = {
                events: {}
            } as unknown as IProperties;
            const children = [];
            const ref = fake();

            const eventRef = Hooks.setEventHook(tagName, propsWithoutEvents, children, id, controlNode, ref)[4];
            assert.strictEqual(eventRef, ref, 'вернулся другой ref несмотря на отсутствие событий');
        });

        it('unmountRef clears input', () => {
            const tagName = 'input';
            const element = createMockElement(tagName) as TWasabyInputElement;
            const id = 'inst_1';
            const controlNode = createMockControlNode(id);
            const props = {
                events: {
                    'on:event': [{}]
                }
            } as unknown as IProperties;
            const children = [];

            const eventRef = Hooks.setEventHook(tagName, props, children, id, controlNode)[4];
            eventRef(element);
            assert.ok(globalEnvironment.eventSystem.addCaptureEventHandler.calledOnce, 'mountRef не вызвал метод addCaptureEventHandler');

            element.value = 'some value';
            controlNode.markup = undefined;
            eventRef();
            assert.notOk(element.hasOwnProperty('value'), 'Ожидалось, что value элемента удалится, чтобы подставился defautValue');
        });
    });
});

class ControlNodeMock {
    control = {};
    markup = {
        type: ''
    };
    environment = globalEnvironment;

    constructor(public id: string, markupType: string = '', public events: TEventsObject = {}) {
        this.markup.type = markupType;
    };
}

class HTMLMockElement {
    controlNodes: IControlNode[] = [];
    eventProperties: TEventsObject = {};
    eventPropertiesCnt: number = 0;

    readonly tagName: string;

    constructor(tagName: string) {
        this.tagName = tagName.toUpperCase();
    }
}

function createMockControlNode(id: string, markupType?: string, events?: TEventsObject): IControlNode {
    return new ControlNodeMock(id, markupType, events) as unknown as IControlNode;
}

function createMockElement(tagName: string): IWasabyHTMLElement {
    return new HTMLMockElement(tagName) as unknown as IWasabyHTMLElement;
}
