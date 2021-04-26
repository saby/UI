define([
   'UITest/MarkupSpecification/testing',
   'UITest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'Partial optional rendering': {
         templateStr: '' +
            '<span>' +
               '<ws:partial template="optional!SBIS3.CORE.Mama"/>' +
            '</span>',
         checkers: checkStr('<span></span>')
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
