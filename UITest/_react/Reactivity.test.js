define(['UI/ReactReactivity', 'Core/core-extend'],
    function (Reactivity, extend) {
       'use strict';

       describe('Pure Reactivity', function () {
          it('update if observe props change version', function () {
             let updated = false;
             let TestControl = extend.extend({
                setState: function () {
                   updated = true;
                }
            });
            let inst = new TestControl();

            let obj = {};
            obj._version = 0;
            inst.prop = obj;
            assert.isFalse(updated);

            Reactivity.makeObservable(inst, ['prop']);

            inst.prop._version++;
            assert.isTrue(updated);
         });

         it('dont update if props not observer', function() {
            let updated = false;
            let TestControl = extend.extend({
               setState: function() {
                  updated = true;
               }
            });
            let inst = new TestControl();

            let obj = {};
            obj._version = 0;
            inst.prop = obj;
            assert.isFalse(updated);

            Reactivity.makeObservable(inst, []);

            inst.prop._version++;
            assert.isFalse(updated);
         });
      });
   });
