define([
   'UICore/Vdom',
   'Core/core-extend'
], function (
   Vdom,
   extend
) {
   'use strict';

   // TODO: отрефакторить или удалить.

   var Functional = Vdom.Functional;

   describe('UI/_vdom/Utils/Functional', function () {


      describe('API', function() {
         it('argumentsToArray', function () {
            var f = function(){
               var arr = Functional.argumentsToArray(arguments);
               assert.isTrue(arr.toString() === 'true,false');
            };

            f(true, false);
         });

         it('composeWithResultsApply', function () {
            var fl1 = false,
               fl2 = false,
               f1 = function (temp) {
                  if (temp === 555) {
                     fl1 = true;
                  }
                  return 333;
               }, f2 = function (temp) {
                  if (temp === 777) {
                     fl2 = true;
                  }
                  return 555;
               };

            var res = Functional.composeWithResultApply(f1, f2)(777);

            assert.isTrue(fl1);
            assert.isTrue(fl2);
            assert.isTrue(res === 333);
         });


         it('reduceHierarchyFunctions', function () {
            var fl1 = false,
               fl2 = false,
               f1 = function (temp) {
                  if (temp === 777) {
                     fl2 = true;
                  }
                  return 555;
               },
               f2 = function (temp) {
                  if (temp === 555) {
                     fl1 = true;
                  }
                  return 333;
               },
               base = extend.extend({
                  constructor: function(){},
                  method: f1
               }),
               next = base.extend({
                  constructor: function(){},
                  method: f2
               });

            var res = Functional.reduceHierarchyFunctions(next, 'method', function(result, fn){
               return fn(result);
            }, 777);

            assert.isTrue(fl1);
            assert.isTrue(fl2);
            assert.isTrue(res === 333);

         });


         it('getHierarchyFunctions && composeHierarchyFunctions', function () {
            var fl1 = false,
               fl2 = false,
               f1 = function (temp) {
                  if (temp === 777) {
                     fl2 = true;
                  }
                  return 555;
               },
               f2 = function (temp) {
                  if (temp === 555) {
                     fl1 = true;
                  }
                  return 333;
               },
               base = extend.extend({
                  constructor: function(){},
                  method: f1
               }),
               next = base.extend({
                  constructor: function(){},
                  method: f2
               });

            var res = Functional.getHierarchyFunctions(next, 'method');
            assert.isTrue(res.length === 2);

            Functional.composeHierarchyFunctions(next, 'method')(777);
            assert.isTrue(fl1);
            assert.isTrue(fl2);


         });

      });

   });

});
