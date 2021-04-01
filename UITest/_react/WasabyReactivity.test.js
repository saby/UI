define(['UI/WasabyReactReactivity', 'Core/core-extend'],
    function (Reactivity, extend) {
       'use strict';

       describe('WasabyReact Reactivity', function () {

          it('basic', function () {
             const tmpl = {
                reactiveProps: ['_string']
             };
             let updated = false;
            let TestControl = extend.extend({
               _template: tmpl,
               setState: function() {
                  updated = true;
               }
            });
            const inst = new TestControl();
            inst._string = '';
            assert.isFalse(updated);
            Reactivity.makeWasabyObservable(inst);
            inst._string = 'wow';
            assert.isTrue(updated);
         });

         it('new template new property', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let newTmpl = {
               reactiveProps: ['anotherProp']
            };
            let updateCount = 0;
            let TestControl = extend.extend({
               _template: tmpl,
               setNewTemplate: function() {
                  this._template = newTmpl;
               },
               setState: function() {
                  updateCount++;
               }
            });
            let inst = new TestControl();

            Reactivity.makeWasabyObservable(inst);

            inst.anotherProp = false;
            assert.equal(updateCount, 0);

            inst.setNewTemplate();
            assert.equal(updateCount, 1);

            inst.anotherProp = true;
            assert.equal(updateCount, 2);
         });

         it('new template old property', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let newTmpl = {
               reactiveProps: ['anotherProp']
            };
            let updateCount = 0;
            let TestControl = extend.extend({
               _template: tmpl,
               setNewTemplate: function() {
                  this._template = newTmpl;
               },
               setState: function() {
                  updateCount++;
               }
            });
            let inst = new TestControl();

            Reactivity.makeWasabyObservable(inst);

            inst.prop = false;
            assert.equal(updateCount, 1);

            inst.setNewTemplate();
            assert.equal(updateCount, 2);

            inst.prop = true;
            assert.equal(updateCount, 2);
         });

         it('array', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let updated = false;
            let TestControl = extend.extend({
               _template: tmpl,
               setState: function() {
                  updated = true;
               }
            });
            let inst = new TestControl();

            inst.prop = [];
            assert.isFalse(updated);

            Reactivity.makeWasabyObservable(inst);

            inst.prop.push(123);
            assert.isTrue(updated);
         });

         it('versioned object', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let updated = false;
            let TestControl = extend.extend({
               _template: tmpl,
               setState: function() {
                  updated = true;
               }
            });
            let inst = new TestControl();

            let obj = {};
            obj._version = 0;
            inst.prop = obj;
            assert.isFalse(updated);

            Reactivity.makeWasabyObservable(inst);

            inst.prop._version++;
            assert.isTrue(updated);
         });

         it('property with get set', function() {
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
               setState: function() {
                  updated = true;
               }
            });
            let inst = new TestControl();

            inst.prop = '1';
            assert.isFalse(updated);

            Reactivity.makeWasabyObservable(inst);

            inst.prop = '2';
            assert.isTrue(updated);

            assert.equal(inst.prop, '2!');
         });

         it('rebuild parent if child prop changes - prop', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let updated = false;
            let TestControl = extend.extend({
               _template: tmpl,
               setState: function() {
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

            Reactivity.makeWasabyObservable(inst);
            Reactivity.makeWasabyObservable(inst2);

            inst.prop = {};
            assert.isTrue(updated);
         });

         it('rebuild parent if child prop changes - versioned object', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let updated = false;
            let TestControl = extend.extend({
               _template: tmpl,
               setState: function() {
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
            obj._version = 0;
            inst.prop = obj;
            inst2.prop = obj;
            assert.isFalse(updated);

            Reactivity.makeWasabyObservable(inst, tmpl);
            Reactivity.makeWasabyObservable(inst2, tmpl2);

            inst.prop._version++;
            assert.isTrue(updated);
         });

         it('rebuild parent if child prop changes - array', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let updated = false;
            let TestControl = extend.extend({
               _template: tmpl,
               setState: function() {
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

            Reactivity.makeWasabyObservable(inst);
            Reactivity.makeWasabyObservable(inst2);

            inst.prop.push('text');
            assert.isTrue(updated);
         });

         it('release properties', function() {
            let tmpl = {
               reactiveProps: ['prop']
            };
            let updated = false;
            let TestControl = extend.extend({
               _template: tmpl,
               setState: function() {
                  updated = true;
               }
            });
            let inst = new TestControl();

            inst.prop = false;
            assert.notOk(updated);

            Reactivity.makeWasabyObservable(inst);
            Reactivity.releaseProperties(inst);

            inst.prop = true;
            assert.notOk(updated);
         });

         it('release versioned object', function() {
            let obj = {};
            obj._version = 0;

            let TestControl = extend.extend({
               _template: {
                  reactiveProps: ['prop']
               },
               updated: 0,
               setState: function() {
                  this.updated++;
               }
            });
            let inst = new TestControl();
            inst.prop = obj;
            Reactivity.makeWasabyObservable(inst);

            let TestControl2 = extend.extend({
               _template: {
                  reactiveProps: ['prop']
               },
               updated: 0,
               setState: function() {
                  this.updated++;
               }
            });
            let inst2 = new TestControl2();
            inst2.prop = obj;
            Reactivity.makeWasabyObservable(inst2);

            assert.equal(inst.updated, 0);
            assert.equal(inst2.updated, 0);

            obj._version++;

            assert.equal(inst.updated, 1);
            assert.equal(inst2.updated, 0);

            Reactivity.releaseProperties(inst2);
            obj._version++;

            assert.equal(inst.updated, 2);
            assert.equal(inst2.updated, 0);
            Reactivity.releaseProperties(inst);
            obj._version++;

            assert.equal(inst.updated, 2);
            assert.equal(inst2.updated, 0);
         });
      });
   });
