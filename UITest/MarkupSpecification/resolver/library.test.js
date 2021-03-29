define([
   'UITest/MarkupSpecification/testing',
   'UITest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'Library 1': {
         templateStr: '' +
            '<ws:partial template="UITest/MarkupSpecification/resolver/TestLibrary:TestControl"/>',
         checkers: [
            checkStr('<div></div>')
         ],
         executionConfig: {
            data: {
            }
         },
      },
   };

   describe('Markup!', () => {
      beforeEach(function() {
         // пока не работает потому что не выделен модуль с реактом, с которым надо запускать эти тесты
         this.skip();
      });
      Testing.runTests(tests);
   });
});
