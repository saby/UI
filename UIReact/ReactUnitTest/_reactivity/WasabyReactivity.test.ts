import {makeWasabyObservable, releaseProperties} from 'UICore/WasabyReactivity';
import * as extend from 'Core/core-extend';
import {assert} from 'chai';
import {createSandbox} from "sinon";
import {act} from "react-dom/test-utils";

describe('WasabyReact Reactivity', function () {
    let sandbox;
    let clock;
    beforeEach(() => {
        sandbox = createSandbox();
        clock = sandbox.useFakeTimers();
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    /**
     * Асинхронный аналог {@link tick}, отличается тем, что эта версия позволяет выполниться коллбекам промисов.
     * @param duration Значение, на которое должно продвинуться время.
     */
    async function tickAsync(duration: number): Promise<void> {
        return act(async () => {
            // в новой версии sinon есть clock.tickAsync, который в теории делает то же самое
            clock.tick(duration);
            await Promise.resolve();
        });
    }

    it('should update when field changed', async () => {
        const tmpl = {
            reactiveProps: ['_string']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            _forceUpdate: function () {
                updated = true;
            }
        });
        const inst = new TestControl();
        inst._string = '';
        assert.isFalse(updated);
        makeWasabyObservable(inst);
        inst._string = 'wow';
        await tickAsync(0)
        assert.isTrue(updated);
    });

    it('should change reactiveValues when template change', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let newTmpl = {
            reactiveProps: ['anotherProp']
        };
        let updateCount = 0;
        let TestControl = extend.extend({
            _template: tmpl,
            setNewTemplate: function () {
                this._template = newTmpl;
            },
            _forceUpdate: function () {
                updateCount++;
            }
        });
        let inst = new TestControl();

        makeWasabyObservable(inst);

        inst.anotherProp = false;
        await tickAsync(0)
        assert.equal(updateCount, 0);

        inst.setNewTemplate();
        await tickAsync(0)
        assert.equal(updateCount, 1);

        inst.anotherProp = true;
        await tickAsync(0)
        assert.equal(updateCount, 2);
    });

    it('shouldn"t update instance when change old props', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let newTmpl = {
            reactiveProps: ['anotherProp']
        };
        let updateCount = 0;
        let TestControl = extend.extend({
            _template: tmpl,
            setNewTemplate: function () {
                this._template = newTmpl;
            },
            _forceUpdate: function () {
                updateCount++;
            }
        });
        let inst = new TestControl();

        makeWasabyObservable(inst);

        inst.prop = false;
        await tickAsync(0)
        assert.equal(updateCount, 1);

        inst.setNewTemplate();
        await tickAsync(0)
        assert.equal(updateCount, 2);

        inst.prop = true;
        await tickAsync(0)
        assert.equal(updateCount, 2);
    });

    it('should update when push in reactive array', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            _forceUpdate: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        inst.prop = [];
        assert.isFalse(updated);

        makeWasabyObservable(inst);

        inst.prop.push(123);
        await tickAsync(0)
        assert.isTrue(updated);
    });

    it('should update when version change', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            _forceUpdate: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        let obj: { _version?: number } = {};
        obj._version = 0;
        inst.prop = obj;
        assert.isFalse(updated);

        makeWasabyObservable(inst);

        inst.prop._version++;
        await tickAsync(0)
        assert.isTrue(updated);
    });

    it('should update with custom setter and getter', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            get prop() {
                return this._prop + '!';
            },
            set prop(newVal) {
                this._prop = newVal;
            },
            _forceUpdate: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        inst.prop = '1';
        assert.isFalse(updated);

        makeWasabyObservable(inst);

        inst.prop = '2';
        await tickAsync(0)
        assert.isTrue(updated);

        assert.equal(inst.prop, '2!');
    });

    it('should rebuild parent if child prop changed - base', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            _forceUpdate: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        let tmpl2 = {
            reactiveProps: ['prop']
        };
        let TestControl2 = extend.extend({
            _template: tmpl2
        });
        let inst2 = new TestControl2();

        let obj = {};
        inst.prop = obj;
        inst2.prop = obj;
        assert.isFalse(updated);

        makeWasabyObservable(inst);
        makeWasabyObservable(inst2);

        inst.prop = {};
        await tickAsync(0);
        assert.isTrue(updated);
    });

    it('should rebuild parent if child prop changed - version object', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            _forceUpdate: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        let tmpl2 = {
            reactiveProps: ['prop']
        };
        let TestControl2 = extend.extend({
            _template: tmpl2
        });
        let inst2 = new TestControl2();

        let obj: { _version?: number } = {};
        obj._version = 0;
        inst.prop = obj;
        inst2.prop = obj;
        assert.isFalse(updated);

        makeWasabyObservable(inst);
        makeWasabyObservable(inst2);

        inst.prop._version++;
        await tickAsync(0);
        assert.isTrue(updated);
    });

    it('should rebuild parent if child prop changes - array', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            _forceUpdate: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        let tmpl2 = {
            reactiveProps: ['prop']
        };
        let TestControl2 = extend.extend({
            _template: tmpl2
        });
        let inst2 = new TestControl2();

        let obj = [];
        inst.prop = obj;
        inst2.prop = obj;
        assert.isFalse(updated);

        makeWasabyObservable(inst);
        makeWasabyObservable(inst2);

        inst.prop.push('text');
        await tickAsync(0);
        assert.isTrue(updated);
    });

    it('shouldn"t update when released properties', async () => {
        let tmpl = {
            reactiveProps: ['prop']
        };
        let updated = false;
        let TestControl = extend.extend({
            _template: tmpl,
            _forceUpdate: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        inst.prop = false;
        await tickAsync(0);
        assert.notOk(updated);

        makeWasabyObservable(inst);
        releaseProperties(inst);

        inst.prop = true;
        await tickAsync(0);
        assert.notOk(updated);
    });

    it('should release versioned object', async () => {
        let obj: { _version?: number } = {};
        obj._version = 0;

        let TestControl = extend.extend({
            _template: {
                reactiveProps: ['prop']
            },
            updated: 0,
            _forceUpdate: function () {
                this.updated++;
            }
        });
        let inst = new TestControl();
        inst.prop = obj;
        makeWasabyObservable(inst);

        let TestControl2 = extend.extend({
            _template: {
                reactiveProps: ['prop']
            },
            updated: 0,
            _forceUpdate: function () {
                this.updated++;
            }
        });
        let inst2 = new TestControl2();
        inst2.prop = obj;
        makeWasabyObservable(inst2);

        assert.equal(inst.updated, 0);
        assert.equal(inst2.updated, 0);

        obj._version++;
        await tickAsync(0);
        assert.equal(inst.updated, 1);
        assert.equal(inst2.updated, 0);

        releaseProperties(inst2);
        obj._version++;
        await tickAsync(0);
        assert.equal(inst.updated, 2);
        assert.equal(inst2.updated, 0);
        releaseProperties(inst);
        obj._version++;
        await tickAsync(0);
        assert.equal(inst.updated, 2);
        assert.equal(inst2.updated, 0);
    });
});
