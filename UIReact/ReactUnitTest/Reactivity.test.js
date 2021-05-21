define(['UICore/Reactivity', 'Core/core-extend'],
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

              Reactivity.makeObservable(inst, ['prop']);

              inst.prop._nextVersion();
              assert.isTrue(updated);
          });

         it('dont update if props not observer', function() {
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

             Reactivity.makeObservable(inst, []);

             inst.prop._nextVersion();
             assert.isFalse(updated);
         });
           it('getReactiveVersionsProp get right version value', function () {
               let version = 0;

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

               version = Reactivity.getReactiveVersionsProp([obj, obj2]);
               assert.equal(version, 6);
               obj._nextVersion();
               version = Reactivity.getReactiveVersionsProp([obj, obj2]);
               assert.equal(version, 7);
           });
       });
   });
