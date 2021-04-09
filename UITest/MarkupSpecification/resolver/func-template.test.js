define([
   'UITest/MarkupSpecification/testing',
   'UITest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'check content option with func notation': {
         templateStr: '' +
            '<UITest.MarkupSpecification.resolver.Top/>',
         checkers: [
            checkStr('<div><div>123</div></div>')
         ]
      }
   };

   describe('Markup!', () => {
      beforeEach(function() {
         // пока не работает потому что не выделен модуль с реактом, с которым надо запускать эти тесты
         this.skip();
      });
      Testing.runTests(tests);
   });
});
