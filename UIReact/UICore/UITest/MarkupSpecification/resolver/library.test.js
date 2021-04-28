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
      Testing.runTests(tests);
   });
});
