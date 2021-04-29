define([
   'ReactUnitTest/MarkupSpecification/testing',
   'ReactUnitTest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'check content option with func notation': {
         templateStr: '' +
            '<ReactUnitTest.MarkupSpecification.resolver.Top/>',
         checkers: [
            checkStr('<div><div>123</div></div>')
         ]
      }
   };

   describe('Markup!', () => {
      Testing.runTests(tests);
   });
});
