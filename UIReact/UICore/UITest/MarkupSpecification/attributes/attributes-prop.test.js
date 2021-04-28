define([
   'UITest/MarkupSpecification/testing',
   'UITest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'Template attributes splash': {
         templateStr: '' +
            '<ws:template name="rr">' +
               '<ws:partial attributes="{{ attrs }}" template="{{injected}}"></ws:partial>' +
            '</ws:template>' +
            '<ws:partial template="rr" attrs="{{ attributes }}">' +
               '<ws:injected><i>text</i></ws:injected>' +
            '</ws:partial>',
         checkers: checkStr('<i id="crash" data="cheep" class="some">text</i>'),
         executionConfig: {
            data: {
               attributes: {
                  class: 'some',
                  id: 'crash',
                  data: 'cheep'
               }
            }
         },
      }
   };

   describe('Markup!', () => {
      Testing.runTests(tests);
   });
});
