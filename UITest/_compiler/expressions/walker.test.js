/* global describe, it, assert */
define([
   'Compiler/expressions/DirtyCheckingPatch',
   'Compiler/expressions/Statement'
], function(Walkers, statementExpressions) {
   'use strict';

   function assertArray(actual, expected) {
      assert.strictEqual(actual.length, expected.length);
      var actualSorted = actual.sort();
      var expectedSorted = expected.sort();
      for (var i = 0; i < actual.length; ++i) {
         assert.strictEqual(actualSorted[i], expectedSorted[i]);
      }
   }

   describe('Compiler/expressions/DirtyCheckingPatch (walkers)', function() {
      describe('.collectIdentifiers()', function() {
         it('collect', function() {
            var node = statementExpressions.processProperty('obj.func(arr, "test", test(1, true, idx)) ? run(name) : (1 + some)');
            var expected = ['obj', 'arr', 'test', 'idx', 'run', 'name', 'some'];
            var identifiers = Walkers.collectIdentifiers(node);
            assertArray(identifiers, expected);
         });
         it('empty', function() {
            var node = statementExpressions.processProperty('"test"');
            var expected = [ ];
            var identifiers = Walkers.collectIdentifiers(node);
            assertArray(identifiers, expected);
         });
      });
      describe('.hasIgnoredIdentifier()', function() {
         it('true', function() {
            var node = statementExpressions.processProperty('obj.func(arr, "test", test(1, true, array.get(idx).value))');
            var ignoredIdentifiers = {
               'array': true
            };
            assert.isTrue(Walkers.hasIgnoredIdentifier(node, ignoredIdentifiers));
         });
         it('false', function() {
            var node = statementExpressions.processProperty('obj.func(arr, "test", test(1, true, array.get(idx).value))');
            var ignoredIdentifiers = {
               'children': true
            };
            assert.isFalse(Walkers.hasIgnoredIdentifier(node, ignoredIdentifiers));
         });
      });
      describe('.collectNonIgnoredIdentifiers()', function() {
         it('ignore some', function() {
            var node = statementExpressions.processProperty('obj.func(arr, "test", test(1, true, idx)) ? run(name) : (1 + some)');
            var ignoredIdentifiers = {
               'obj': true,
               'run': true,
               'idx': true
            };
            var expected = ['arr', 'test', 'name', 'some'];
            var expressions = Walkers.collectNonIgnoredIdentifiers(node, ignoredIdentifiers);
            var identifiers = expressions.map(function(expression) {
               return expression.name.string;
            });
            assertArray(identifiers, expected);
         });
         it('ignore all', function() {
            var node = statementExpressions.processProperty('func(arr, "test", idx)');
            var ignoredIdentifiers = {
               'func': true,
               'arr': true,
               'idx': true
            };
            var expected = [ ];
            var expressions = Walkers.collectNonIgnoredIdentifiers(node, ignoredIdentifiers);
            var identifiers = expressions.map(function(expression) {
               return expression.name.string;
            });
            assertArray(identifiers, expected);
         });
      });
      describe('.collectDroppedExpressions()', function() {
         it('member expression', function() {
            var node = statementExpressions.processProperty('a.b.c.d');
            var expected = ['a.b.c', 'a.b.c.d'];
            var expressions = Walkers.collectDroppedExpressions(node);
            var identifiers = expressions.map(function(expression) {
               return expression.name.string;
            });
            assertArray(identifiers, expected);
         });
         it('member expression with computed member', function() {
            var node = statementExpressions.processProperty('a.b[c.d].e');
            var expected = ['a.b[c.d]', 'a.b[c.d].e'];
            var expressions = Walkers.collectDroppedExpressions(node);
            var identifiers = expressions.map(function(expression) {
               return expression.name.string;
            });
            assertArray(identifiers, expected);
         });
         it('not member expression', function() {
            var node = statementExpressions.processProperty('prop');
            var expected = ['prop'];
            var expressions = Walkers.collectDroppedExpressions(node);
            var identifiers = expressions.map(function(expression) {
               return expression.name.string;
            });
            assertArray(identifiers, expected);
         });
      });
   });
});
