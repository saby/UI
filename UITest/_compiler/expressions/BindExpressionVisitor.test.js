/* global describe, it, assert */
define([
   'Compiler/expressions/_private/Statement',
   'Compiler/expressions/_private/Bind'
], function(StatementLib, BindLib) {
   'use strict';

   /**
    * TODO: распутать кодогенерацию и убрать завязку тестов на результат кодогенерации.
    */

   function process(text) {
      return BindLib.visitBindExpressionNew(
         {
            data: [StatementLib.processProperty(text)]
         },
         null,
         'Compiler/expressions/_private/Bind.test.wml',
         'eventName'
      );
   }

   describe('Compiler/expressions/_private/Bind', function() {
      describe('API', function() {
         it('isBind', function() {
            assert.isTrue(BindLib.isBind('bind:text'));
            assert.isFalse(BindLib.isBind('event:text'));
            assert.isFalse(BindLib.isBind('bind:'));
            assert.isFalse(BindLib.isBind('bindtext'));
         });
      });
      describe('Spec', function() {
         it('Bind on identifier', function() {
            const functionString = process('identifier');
            assert.strictEqual(functionString, 'thelpers.setter(data, ["identifier"], value)');
         });
         it('Bind on context identifier', function() {
            const functionString = process('data.property.identifier');
            assert.strictEqual(functionString, 'thelpers.setter(data, ["data","property","identifier"], value)');
         });
         it('Bind on computed context identifier', function() {
            const functionString = process('data["property"].identifier');
            assert.strictEqual(functionString, 'thelpers.setter(data, ["data","property","identifier"], value)');
         });
         it('Bind on computed context identifier 2', function() {
            const functionString = process('data[property].identifier');
            assert.strictEqual(functionString, 'thelpers.setter(data, ["data",thelpers.getter(data, ["property"]),"identifier"], value)');
         });
         it('Bind on computed context identifier 3', function() {
            const functionString = process('data[condition ? first : second].identifier');
            assert.strictEqual(functionString, 'thelpers.setter(data, ["data",(thelpers.getter(data, ["condition"]) ? thelpers.getter(data, ["first"]) : thelpers.getter(data, ["second"])),"identifier"], value)');
         });
         it('Bind on computed context identifier 4', function() {
            const functionString = process('data[property.getName()].identifier');
            assert.strictEqual(functionString, 'thelpers.setter(data, ["data",thelpers.getter(data, ["property","getName"]).apply(thelpers.getter(data, ["property"]), []),"identifier"], value)');
         });
         it('Bind on record on _options', function() {
            const functionString = process('_options.record.field');
            assert.strictEqual(functionString, 'thelpers.setter(data, ["_options","record","field"], value)');
         });
      });
      describe('Stress', function() {
         it('Literal', function() {
            try {
               process('123');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено выполнять bind на литералы');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Binary operator in root', function() {
            try {
               process('ident1 + ident2');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено использовать бинарный оператор в корне bind-выражения');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Logical operator in root', function() {
            try {
               process('ident1 || ident2');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено использовать логический оператор в корне bind-выражения');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Unary operator in root', function() {
            try {
               process('-ident1');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено использовать унарный оператор в корне bind-выражения');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Conditional operator in root', function() {
            try {
               process('condition ? ident1 : ident2');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено использовать тернарный оператор в корне bind-выражения');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Array declaration in root', function() {
            try {
               process('[ident]');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено объявлять массив в корне bind-выражения');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Object declaration in root', function() {
            try {
               process('{ prop: ident }');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено объявлять объект в корне bind-выражения');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Bind on _options field', function() {
            try {
               process('_options.field');
            } catch (error) {
               assert.strictEqual(error.message, 'Запрещено использовать bind на свойства объекта _options: данный объект заморожен');
               return;
            }
            throw new Error('This test must be failed');
         });
      });
   });
});
