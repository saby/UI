/* global describe, it, assert */
define(['UICore/Reactivity', 'Core/core-extend', 'UI/Executor'],
   function(Reactivity, extend, Executor) {
      'use strict';
      var Common = Executor.CommonUtils;
      var ReactiveObserver = Reactivity.ReactiveObserver;
      var observeProperties = ReactiveObserver.observeProperties;
      var releaseProperties = ReactiveObserver.releaseProperties;
      var pauseReactive = ReactiveObserver.pauseReactive;
      var isolateScope = Executor.TClosure.isolateScope;
      var presetScope = Executor.TClosure.presetScope;
      var plainMerge = Common.plainMerge;

      describe('ReactiveObserver', function() {
         it('basic', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            inst.prop = false;
            assert.isFalse(updated);

            observeProperties(inst);

            inst.prop = true;

            assert.isTrue(updated);
         });

         it('new template new property', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var newTmpl = {
               reactiveProps: ['anotherProp']
            };
            var updateCount = 0;
            var TestControl = extend.extend({
               _template: tmpl,
               setNewTemplate: function() {
                  this._template = newTmpl;
               },
               _forceUpdate: function() {
                  updateCount++;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            observeProperties(inst);

            inst.anotherProp = false;
            assert.equal(updateCount, 0);

            inst.setNewTemplate();
            assert.equal(updateCount, 1);

            inst.anotherProp = true;
            assert.equal(updateCount, 2);
         });

         it('new template old property', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var newTmpl = {
               reactiveProps: ['anotherProp']
            };
            var updateCount = 0;
            var TestControl = extend.extend({
               _template: tmpl,
               setNewTemplate: function() {
                  this._template = newTmpl;
               },
               _forceUpdate: function() {
                  updateCount++;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            observeProperties(inst);

            inst.prop = false;
            assert.equal(updateCount, 1);

            inst.setNewTemplate();
            assert.equal(updateCount, 2);

            inst.prop = true;
            assert.equal(updateCount, 2);
         });

         it('array', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            inst.prop = [];
            assert.isFalse(updated);

            observeProperties(inst);

            inst.prop.push(123);
            assert.isTrue(updated);
         });

         it('versioned object', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            var obj = {};
            obj._version = 0;
            inst.prop = obj;
            assert.isFalse(updated);

            observeProperties(inst);

            inst.prop._version++;
            assert.isTrue(updated);
         });

         it('property with get set', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               get prop() {
                  return this._prop + '!';
               },
               set prop(_) {
                  this._prop = _;
               },
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            inst.prop = '1';
            assert.isFalse(updated);

            observeProperties(inst);

            inst.prop = '2';
            assert.isTrue(updated);

            assert.equal(inst.prop, '2!');
         });

         it('getChildContext support', function() {
            var tmpl = {
               reactiveProps: []
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               },
               _getChildContext: function() {
                  return {
                     prop: 123
                  };
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            inst.prop = false;
            assert.isFalse(updated);

            observeProperties(inst);

            inst.prop = true;
            assert.isTrue(updated);
         });

         it('rebuild parent if child prop changes - prop', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            var tmpl2 = {
               reactiveProps: ['prop']
            };
            var TestControl2 = extend.extend({
               _template: tmpl2
            });
            var inst2 = new TestControl2();
            inst2._reactiveStart = true;

            var obj = {};
            inst.prop = obj;
            inst2.prop = obj;
            assert.isFalse(updated);

            observeProperties(inst);
            observeProperties(inst2);

            inst.prop = {};
            assert.isTrue(updated);
         });

         it('rebuild parent if child prop changes - versioned object', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            var tmpl2 = {
               reactiveProps: ['prop']
            };
            var TestControl2 = extend.extend({
               _template: tmpl2
            });
            var inst2 = new TestControl2();
            inst2._reactiveStart = true;

            var obj = {};
            obj._version = 0;
            inst.prop = obj;
            inst2.prop = obj;
            assert.isFalse(updated);

            observeProperties(inst);
            observeProperties(inst2);

            inst.prop._version++;
            assert.isTrue(updated);
         });

         it('rebuild parent if child prop changes - array', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            var tmpl2 = {
               reactiveProps: ['prop']
            };
            var TestControl2 = extend.extend({
               _template: tmpl2
            });
            var inst2 = new TestControl2();
            inst2._reactiveStart = true;

            var obj = [];
            inst.prop = obj;
            inst2.prop = obj;
            assert.isFalse(updated);

            observeProperties(inst);
            observeProperties(inst2);

            inst.prop.push('text');
            assert.isTrue(updated);
         });

         it('pauseReactive basic', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;
            var actionDone = false;
            var action = function() {
               actionDone = true;
               inst.prop++;
            };
            inst.prop = 0;
            observeProperties(inst);
            inst.prop++;
            assert.isTrue(updated);
            updated = false;
            pauseReactive(inst, action);
            assert.isTrue(actionDone);
            assert.isFalse(updated);
            inst.prop++;// Мы здесь меняем prop, чтобы запустить реактивность
            assert.isTrue(updated);
         });

         it('pauseReactive isolateScope ', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;
            inst.prop = 0;
            observeProperties(inst);
            inst.prop++;
            assert.isTrue(updated);
            updated = false;
            isolateScope(inst, { a: 'b' }, 'prop');
            assert.isFalse(updated);
         });

         it('pauseReactive presetScope ', function() {
            var tmpl = {
               reactiveProps: ['prop', 'prop1']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;
            inst.prop = 0;
            observeProperties(inst);
            inst.prop++;
            assert.isTrue(updated);
            updated = false;
            presetScope({ a: 'b' }, inst, 'prop1', { value: 'prop', key: 'prop1' });
            assert.isFalse(updated);
         });

         it('pauseReactive plainMerge ', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;
            inst.prop = 0;
            observeProperties(inst);
            inst.prop++;
            assert.isTrue(updated);
            updated = false;
            plainMerge(inst, { prop: 'b' });
            assert.isFalse(updated);
         });

         it('release properties', function() {
            var tmpl = {
               reactiveProps: ['prop']
            };
            var updated = false;
            var TestControl = extend.extend({
               _template: tmpl,
               _forceUpdate: function() {
                  updated = true;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;

            inst.prop = false;
            assert.notOk(updated);

            observeProperties(inst);
            releaseProperties(inst);

            inst.prop = true;
            assert.notOk(updated);
         });

         it('release versioned object', function() {
            var obj = {};
            obj._version = 0;

            var TestControl = extend.extend({
               _template: {
                  reactiveProps: ['prop']
               },
               updated: 0,
               _forceUpdate: function() {
                  this.updated++;
               }
            });
            var inst = new TestControl();
            inst._reactiveStart = true;
            inst.prop = obj;
            observeProperties(inst);

            var TestControl2 = extend.extend({
               _template: {
                  reactiveProps: ['prop']
               },
               updated: 0,
               _forceUpdate: function() {
                  this.updated++;
               }
            });
            var inst2 = new TestControl2();
            inst2._reactiveStart = true;
            inst2.prop = obj;
            observeProperties(inst2);

            assert.equal(inst.updated, 0);
            assert.equal(inst2.updated, 0);

            obj._version++;

            assert.equal(inst.updated, 1);
            assert.equal(inst2.updated, 0);

            releaseProperties(inst2);
            obj._version++;

            assert.equal(inst.updated, 2);
            assert.equal(inst2.updated, 0);

            releaseProperties(inst);
            obj._version++;

            assert.equal(inst.updated, 2);
            assert.equal(inst2.updated, 0);
         });
      });
   });
