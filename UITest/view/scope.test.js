/* global describe, it, assert */
define(['UI/Executor'], function(Executor) {
   'use strict';

   var Scope = Executor._ForExecutorCompatible.Scope;

   describe('UI/_executor/_Expressions/Scope', function() {
      describe('createScope', function() {
         it('basic', function() {
            const origin = {
               a: 0,
               b: false,
               c: {
                  d: null,
                  e: undefined,
                  f: ''
               },
               g: [1, 2, 3]
            };
            const scope = Scope.createScope(origin);
            assert.isFalse(scope.hasOwnProperty('a'), 'Origin property is not in scope');
            assert.isTrue(origin.isPrototypeOf(scope), 'Origin is proto of scope');
            assert.strictEqual(origin.c, scope.c, 'The same values');
         });
      });
      describe('presetScope', function() {
         it('basic', function() {
            let origin = {
               array: [1, 2, 3]
            };
            const args = {
               key: 'userKey',
               value: 'userValue'
            };
            const value = 'value';
            const key = 'index';
            const scope = Scope.presetScope(value, origin, key, args);
            assert.strictEqual(scope.userKey, 'index', 'Has userKey with value');
            assert.strictEqual(scope.userValue, 'value', 'Has userValue with value');
            assert.isTrue(scope.hasOwnProperty('array'), 'Has origin array property');
            assert.isFalse(origin.isPrototypeOf(scope), 'Origin is not a proto of scope');
         });
      });
      describe('isolateScope', function() {
         it('data is undefined', function() {
            let origin = {
               a: 0,
               b: false,
               c: {
                  d: null,
                  e: undefined,
                  f: ''
               },
               g: [1, 2, 3]
            };
            const property = 'test';
            const scope = Scope.isolateScope(Object.create(origin), undefined, property);
            assert.strictEqual(scope[property], undefined, 'Has undefined isolated property');
            assert.isTrue(origin.isPrototypeOf(scope), 'Origin is proto of scope');
            assert.isTrue(scope[Scope.PATCHED_FLAG_PREFIX + property], 'Has patched flag');
            assert.isTrue(scope[Scope.UNDEF_FLAG_PREFIX + property], 'Has patched flag');
            assert.strictEqual(scope[Scope.ISOLATED_SCOPE_FLAG], property, 'Has isolated flag with property name');
         });
         it('simple', function() {
            let origin = {
               a: 0,
               b: false,
               c: {
                  d: null,
                  e: undefined,
                  f: ''
               },
               g: [1, 2, 3]
            };
            let data = {
               h: 123,
               j: true,
               k: {
                  m: [1, 2],
                  n: null,
                  o: 'value'
               }
            };
            const property = 'test';
            const scope = Scope.isolateScope(Object.create(origin), data, property);
            assert.strictEqual(scope[property], data, 'Has defined isolated property');
            assert.isTrue(origin.isPrototypeOf(scope), 'Origin is proto of scope');
            for (let prop in data) {
               if (data.hasOwnProperty(prop)) {
                  assert.isTrue(scope[property].hasOwnProperty(prop), 'Has property in isolated scope from data');
               }
            }
            assert.isTrue(scope[Scope.PATCHED_FLAG_PREFIX + property], 'Has patched flag');
            assert.isTrue(scope[Scope.UNDEF_FLAG_PREFIX + property], 'Has patched flag');
            assert.strictEqual(scope[Scope.ISOLATED_SCOPE_FLAG], property, 'Has isolated flag with property name');
         });
         it('with parent', function() {
            let origin = {
               a: 123,
               b: true,
               c: 'string',
               test: {
                  f: 789,
                  g: null
               }
            };
            let data = {
               d: 456,
               e: [1, 2, 3]
            };
            const property = 'test';
            const scope = Scope.isolateScope(Object.create(origin), data, property);
            assert.strictEqual(scope[property][property], origin[property], 'Has defined isolated property');
            assert.isTrue(data.isPrototypeOf(scope[property]), 'Data is proto of new scope');
            assert.isTrue(origin.isPrototypeOf(scope), 'Origin is proto of scope');
            for (let prop in origin[property]) {
               if (origin[property].hasOwnProperty(prop)) {
                  assert.isTrue(scope[property][property].hasOwnProperty(prop), 'Has property in isolated scope from data');
               }
            }
            assert.isTrue(scope[Scope.PATCHED_FLAG_PREFIX + property], 'Has patched flag');
            assert.isFalse(scope.hasOwnProperty(Scope.UNDEF_FLAG_PREFIX + property), 'Has own patched flag');
            assert.strictEqual(scope[Scope.ISOLATED_SCOPE_FLAG], property, 'Has isolated flag with property name');
         });
         it('isolate patched', function() {
            let origin = {
               a: 123,
               b: true,
               c: 'string',
               test: {
                  f: 789,
                  g: null
               }
            };
            let data = {
               d: 456,
               e: [1, 2, 3]
            };
            let patchedData = {
               d: 405060,
               e: [10, 20, 30]
            };
            const property = 'test';
            const patched = Scope.isolateScope(Object.create(origin), data, property);
            const scope = Scope.isolateScope(Object.create(patched), patchedData, property);
            assert.strictEqual(scope[property][property], origin[property], 'Has defined isolated property');
            assert.isTrue(patched.isPrototypeOf(scope), 'Patched is proto of scope');
            assert.isTrue(patchedData.isPrototypeOf(scope[property]), 'Patched data is proto of new scope');
            for (let prop in origin[property]) {
               if (origin[property].hasOwnProperty(prop)) {
                  assert.isTrue(scope[property][property].hasOwnProperty(prop), 'Has property in isolated scope from data');
               }
            }
            assert.isFalse(scope.hasOwnProperty(Scope.PATCHED_FLAG_PREFIX + property), 'Has own patched flag');
            assert.isFalse(scope.hasOwnProperty(Scope.UNDEF_FLAG_PREFIX + property), 'Has own undefined flag');
            assert.strictEqual(scope[Scope.ISOLATED_SCOPE_FLAG], property, 'Has isolated flag with property name');
         });
         it('isolate patched & undefined', function() {
            let origin = {
               a: 123,
               b: true,
               c: 'string'
            };
            let patchedData = {
               d: 405060,
               e: [10, 20, 30]
            };
            const property = 'test';
            const patched = Scope.isolateScope(Object.create(origin), undefined, property);
            const scope = Scope.isolateScope(Object.create(patched), patchedData, property);
            assert.strictEqual(scope[property], patchedData, 'Has defined isolated property');
            assert.isTrue(patched.isPrototypeOf(scope), 'Patched is proto of scope');
            assert.isFalse(scope.hasOwnProperty(Scope.PATCHED_FLAG_PREFIX + property), 'Has own patched flag');
            assert.isTrue(scope[Scope.PATCHED_FLAG_PREFIX + property], 'Has patched flag');
            assert.isFalse(scope.hasOwnProperty(Scope.UNDEF_FLAG_PREFIX + property), 'Has own undefined flag');
            assert.isTrue(scope[Scope.UNDEF_FLAG_PREFIX + property], 'Has patched flag');
            assert.strictEqual(scope[Scope.ISOLATED_SCOPE_FLAG], property, 'Has isolated flag with property name');
         });
      });
      describe('uniteScope', function() {
         it('basic', function() {
            let inner = {
               test: 'inner',
               a: 1
            };
            let outer = {
               test: 'outer',
               b: 2
            };
            const scope = Scope.uniteScope(inner, outer)(Executor.TClosure.plainMerge);
            assert.isTrue(inner.isPrototypeOf(scope), 'Inner is proto of scope');
            assert.strictEqual(scope[Scope.ORIGIN_FLAG], inner, 'Has inner as origin');
            for (let prop in inner) {
               if (inner.hasOwnProperty(prop)) {
                  assert.isTrue(scope.hasOwnProperty(prop), 'Has property in scope from inner');
               }
            }
            for (let prop in outer) {
               if (outer.hasOwnProperty(prop)) {
                  assert.isTrue(scope.hasOwnProperty(prop), 'Has property in scope from outer');
                  assert.strictEqual(scope[prop], outer[prop], 'Has property value in scope from outer');
               }
            }
         });
         it('inner is undefined', function() {
            let outer = {
               test: 'outer',
               a: 1,
               b: undefined,
               c: true,
               d: 'string',
               e: '',
               f: [1, 2, 3],
               g: null,
               j: 123
            };
            const scope = Scope.uniteScope(undefined, outer)(Executor.TClosure.plainMerge);
            assert.strictEqual(scope[Scope.ORIGIN_FLAG], undefined, 'Has inner as origin');
            for (let prop in outer) {
               if (outer.hasOwnProperty(prop)) {
                  assert.isTrue(scope.hasOwnProperty(prop), 'Has property in scope from outer');
                  assert.strictEqual(scope[prop], outer[prop], 'Has property value in scope from outer');
               }
            }
         });
         it('outer is undefined', function() {
            let inner = {
               test: 'inner',
               a: undefined,
               b: 2,
               c: false,
               d: '',
               e: 'string',
               f: null,
               g: [1, 2, 3],
               h: 123
            };
            const scope = Scope.uniteScope(inner, undefined)(Executor.TClosure.plainMerge);
            assert.isTrue(inner.isPrototypeOf(scope), 'Inner is proto of scope');
            assert.strictEqual(scope[Scope.ORIGIN_FLAG], inner, 'Has inner as origin');
            for (let prop in inner) {
               if (inner.hasOwnProperty(prop)) {
                  assert.isTrue(scope.hasOwnProperty(prop), 'Has property in scope from inner');
               }
            }
         });
      });
   });
});
