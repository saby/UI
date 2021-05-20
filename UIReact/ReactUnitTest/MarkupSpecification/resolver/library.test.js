define([
   'ReactUnitTest/MarkupSpecification/testing',
   'ReactUnitTest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'Library 1': {
         templateStr: '' +
            '<ws:partial template="ReactUnitTest/MarkupSpecification/resolver/TestLibrary:TestControl"/>',
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
      Testing.runTests(tests);
   });
});
