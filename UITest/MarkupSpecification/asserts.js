/* global assert */
define('UITest/MarkupSpecification/asserts', ['UITest/MarkupSpecification/compareMarkup'], function(compareMarkup) {
   'use strict';

   function assertMarkup(standard, standardVDOM) {
      let checker = function(isVdom, actual) {
         if (isVdom) {
            return compareMarkup(standardVDOM || standard, actual);
         }
         return compareMarkup(standard, actual);
      };
      checker.type = 'markup';
      return checker;
   }

   function assertMarkupContains(standard, standardVDOM) {
      let checker = function(isVdom, actual) {
         let expectedMarkup = isVdom ? standardVDOM || standard : standard;
         if (expectedMarkup instanceof RegExp) {
            assert.match(actual, expectedMarkup);
         } else {
            assert.include(actual, expectedMarkup);
         }
      };
      checker.type = 'markup';
      return checker;
   }

   function assertOptions(standard) {
      // eslint-disable-next-line consistent-return
      let checker = function(actual) {
         if (actual instanceof Error) {
            return false;
         }
         let configStorage = require('Core/helpers/Hcontrol/configStorage').getData();
         let config = actual.match(/config="(.*?)"/)[1];
         standard.forEach(function(element) {
            let option = element[0].call(this, configStorage[config]);
            let isMarkup = element[2];
            if (isMarkup) {
               compareMarkup(element[1], option);
            } else {
               assert.equal(option, element[1]);
            }
         }.bind(this));
      };
      checker.type = 'options';
      return checker;
   }

   function assertDependencies(standard) {
      let checker = function(actual) {
         // FIXME: вот тут различие в методах getComponents и внутреннем методе, который записывает dependencies:
         //  внешний возвращает зависимости + TClosure
         //  внутренний возвращает просто зависимости
         const standardString = standard.concat(['UI/Executor']).sort().join(',');
         const actualString = actual.sort().join(',');
         assert.strictEqual(standardString, actualString);
      };
      checker.type = 'dependencies';
      return checker;
   }

   function virtualTreeChecker(standard, actual) {
      return standard.reduce(function(prevNode, node, index) {
         return prevNode && Object.getOwnPropertyNames(node).reduce(function(prev, next) {
            if (next === 'children') {
               return true;
            }
            let result = node[next] === actual[index][next];
            if (!result) {
               throw new Error(`Property ${next} not equal to the real one. Index of VDOM result: ${index}`);
            }
            return prev && result;
         }, true) && (standard.children ? virtualTreeChecker(standard.children, actual.children) : true);
      }, true);
   }

   function assertVDOM(standard) {
      let checker = function(actual) {
         const checkResult = virtualTreeChecker(standard, actual);
         assert.isTrue(checkResult);
      };
      checker.type = 'vdom';
      return checker;
   }

   function assertReactive(expected) {
      let checker = function(actual) {
         let actualSorted = actual.sort().join(',');
         let expectedSorted = expected.sort().join(',');
         assert.strictEqual(actualSorted, expectedSorted);
      };
      checker.type = 'reactive';
      return checker;
   }

   return {
      assertMarkup: assertMarkup,
      assertMarkupContains: assertMarkupContains,
      assertOptions: assertOptions,
      assertDependencies: assertDependencies,
      assertVDOM: assertVDOM,
      assertReactive: assertReactive
   };
});
