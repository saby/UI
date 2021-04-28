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
      Testing.runTests(tests);
   });
});
