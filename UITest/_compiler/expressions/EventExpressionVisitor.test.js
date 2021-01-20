/* global describe, it, assert */
define([
   'Compiler/expressions/_private/Nodes',
   'Compiler/expressions/_private/Parser'
], function(ExpressionNodes, ParserLib) {
   'use strict';

   /**
    * TODO: распутать кодогенерацию и убрать завязку тестов на результат кодогенерации.
    */

   const EventExpressionVisitor = ExpressionNodes.EventExpressionVisitor;
   const Parser = ParserLib.Parser;

   function process(text, childrenStorage) {
      const context = {
         getterContext: 'this',
         forbidComputedMembers: true,
         checkChildren: true,
         childrenStorage: childrenStorage || []
      };
      const visitor = new EventExpressionVisitor();
      const parser = new Parser();
      const ast = parser.parse(text);
      return visitor.visit(ast, context);
   }

   describe('Compiler/expressions/_private/Event', function() {
      describe('Spec', function() {
         it('Simple handler', function() {
            const result = process('_handler()');
            assert.strictEqual(result.handlerName, '_handler');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, 'thelpers.getter(this, ["_handler"])');
            assert.strictEqual(result.context, 'this');
         });
         it('Simple handler with identifier as argument', function() {
            const result = process('_handler(identifier)');
            assert.strictEqual(result.handlerName, '_handler');
            assert.strictEqual(result.args.length, 1);
            assert.strictEqual(result.args[0], 'thelpers.getter(data, ["identifier"])');
            assert.strictEqual(result.fn, 'thelpers.getter(this, ["_handler"])');
            assert.strictEqual(result.context, 'this');
         });
         it('Simple handler with literal as argument', function() {
            const result = process('_handler(true)');
            assert.strictEqual(result.handlerName, '_handler');
            assert.strictEqual(result.args.length, 1);
            assert.strictEqual(result.args[0], 'true');
            assert.strictEqual(result.fn, 'thelpers.getter(this, ["_handler"])');
            assert.strictEqual(result.context, 'this');
         });
         it('Context handler', function() {
            const result = process('data.property._handler()');
            assert.strictEqual(result.handlerName, '_handler');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, 'thelpers.getter(this, ["data","property","_handler"])');
            assert.strictEqual(result.context, 'thelpers.getter(this, ["data","property"])');
         });
         it('Context handler with identifier as argument', function() {
            const result = process('data.property._handler(identifier)');
            assert.strictEqual(result.handlerName, '_handler');
            assert.strictEqual(result.args.length, 1);
            assert.strictEqual(result.args[0], 'thelpers.getter(data, ["identifier"])');
            assert.strictEqual(result.fn, 'thelpers.getter(this, ["data","property","_handler"])');
            assert.strictEqual(result.context, 'thelpers.getter(this, ["data","property"])');
         });
         it('Context handler in braces', function() {
            const result = process('(data.property._handler)()');
            assert.strictEqual(result.handlerName, '_handler');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, '(thelpers.getter(this, ["data","property","_handler"]))');
            assert.strictEqual(result.context, 'thelpers.getter(this, ["data","property"])');
         });
         it('Handler with the same name as parent', function() {
            const result = process('process()', ['process']);
            assert.strictEqual(result.handlerName, 'process');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, 'thelpers.getter(this, ["process"])');
            assert.strictEqual(result.context, 'this');
         });
         it('Context handler with parent', function() {
            const result = process('parent.handler()', ['parent']);
            assert.strictEqual(result.handlerName, 'handler');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, 'thelpers.getter(this._children, ["parent","handler"])');
            assert.strictEqual(result.context, 'thelpers.getter(this._children, ["parent"])');
         });
         it('Context handler with braced parent', function() {
            const result = process('(parent.handler)()', ['parent']);
            assert.strictEqual(result.handlerName, 'handler');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, '(thelpers.getter(this._children, ["parent","handler"]))');
            assert.strictEqual(result.context, 'thelpers.getter(this._children, ["parent"])');
         });
         it('Long context handler with parent', function() {
            const result = process('a.b.c.d.e.f.g()', ['a']);
            assert.strictEqual(result.handlerName, 'g');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, 'thelpers.getter(this._children, ["a","b","c","d","e","f","g"])');
            assert.strictEqual(result.context, 'thelpers.getter(this._children, ["a","b","c","d","e","f"])');
         });
         it('Long context handler', function() {
            const result = process('a.b.c.d.e.f.g()');
            assert.strictEqual(result.handlerName, 'g');
            assert.strictEqual(result.args.length, 0);
            assert.strictEqual(result.fn, 'thelpers.getter(this, ["a","b","c","d","e","f","g"])');
            assert.strictEqual(result.context, 'thelpers.getter(this, ["a","b","c","d","e","f"])');
         });
         it('Handler arguments with parent', function() {
            const result = process('parent.handler(a, parent.b)', ['parent']);
            assert.strictEqual(result.handlerName, 'handler');
            assert.strictEqual(result.args.length, 2);
            assert.strictEqual(result.args[0], 'thelpers.getter(data, ["a"])');
            assert.strictEqual(result.args[1], 'thelpers.getter(data, ["parent","b"])');
            assert.strictEqual(result.fn, 'thelpers.getter(this._children, ["parent","handler"])');
            assert.strictEqual(result.context, 'thelpers.getter(this._children, ["parent"])');
         });
      });
      describe('Stress', function() {
         it('Non-function', function() {
            try {
               process('123');
            } catch (error) {
               assert.strictEqual(error.message, 'Ожидалось, что обработчик события является функцией');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Computed function handler name', function() {
            try {
               process('data.property["_handler"]()');
            } catch (error) {
               assert.strictEqual(error.message, 'Имя функции-обработчика события не может быть вычисляемым');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Computed context handler', function() {
            try {
               process('data[item.get("value")]._handler()');
            } catch (error) {
               assert.strictEqual(error.message, 'Вычисляемые member-выражения запрещены');
               return;
            }
            throw new Error('This test must be failed');
         });
         it('Context with literal handler', function() {
            try {
               process('data["property"]._handler()');
            } catch (error) {
               assert.strictEqual(error.message, 'Вычисляемые member-выражения запрещены');
               return;
            }
            throw new Error('This test must be failed');
         });
      });
   });
});
