define([
   'ReactUnitTest/MarkupSpecification/testing',
   'ReactUnitTest/MarkupSpecification/asserts'
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
      Testing.runTests(tests);
   });
});
