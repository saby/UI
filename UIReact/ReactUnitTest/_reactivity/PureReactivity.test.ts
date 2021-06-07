// @ts-ignore в inferno есть такой же модуль, но с другими экспортами
import {makeObservable, getReactiveVersionsProp} from 'UICore/Reactivity';
import * as extend from 'Core/core-extend';
import {assert} from 'chai';

describe('Pure Reactivity', function () {
    it('should update if observe props change version', () => {
        let updated = false;
        let TestControl = extend.extend({
            setState: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        const obj = {
            _version: 0,
            getVersion: function () {
                return this._version
            },
            _nextVersion: function () {
                this._version++
            }
        };
        inst.prop = obj;
        assert.isFalse(updated);

        makeObservable(inst, ['prop']);

        inst.prop._nextVersion();
        assert.isTrue(updated);
    });

    it('shouldn"t update if props not observer', () => {
        let updated = false;
        let TestControl = extend.extend({
            setState: function () {
                updated = true;
            }
        });
        let inst = new TestControl();

        const obj = {
            _version: 0,
            getVersion: function () {
                return this._version
            },
            _nextVersion: function () {
                this._version++
            }
        };
        inst.prop = obj;
        assert.isFalse(updated);

        makeObservable(inst, []);

        inst.prop._nextVersion();
        assert.isFalse(updated);
    });

    it('getReactiveVersionsProp get right version value', () => {
        let version;

        const obj = {
            _version: 2,
            getVersion: function () {
                return this._version
            },
            _nextVersion: function () {
                this._version++
            }
        };
        const obj2 = {
            _version: 4,
            getVersion: function () {
                return this._version
            },
            _nextVersion: function () {
                this._version++
            }
        };

        version = getReactiveVersionsProp([obj, obj2]);
        assert.equal(version, 6);
        obj._nextVersion();
        version = getReactiveVersionsProp([obj, obj2]);
        assert.equal(version, 7);
    });
});
