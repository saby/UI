define([
   'UITest/MarkupSpecification/testing',
   'UITest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'Array content template 1': {
         templateStr: '' +
            '<div>' +
            '   <UITest.MarkupSpecification.scope.children-some>' +
            '      <ws:someTpl>' +
            '         <UITest.MarkupSpecification.scope.children-inner prop4="777" prop5="888" />' +
            '      </ws:someTpl>' +
            '   </UITest.MarkupSpecification.scope.children-some>' +
            '</div>',
         checkers: [
            checkStr('' +
               '<div>' +
                  '<div>' +
                     '<div>' +
                        '444 555 666 777 888' +
                     '</div>' +
                  '</div>' +
               '</div>')
         ]
      },
      'Array content template 2': {
         templateStr: '' +
            '<div>' +
               '<UITest.MarkupSpecification.scope.children-in-template>' +
                  '<ws:some>' +
                     '<ws:case>' +
                        '<ws:Array>' +
                           '<ws:Object>' +
                              '<ws:someTpl>' +
                                 '<UITest.MarkupSpecification.scope.children-inner prop4="777" prop5="888" />' +
                              '</ws:someTpl>' +
                           '</ws:Object>' +
                        '</ws:Array>' +
                     '</ws:case>' +
                  '</ws:some>' +
               '</UITest.MarkupSpecification.scope.children-in-template>' +
            '</div>',
         checkers: [
            checkStr('' +
               '<div>' +
                  '<div>' +
                     '<div>' +
                        '444 555 666 777 888' +
                     '</div>' +
                  '</div>' +
               '</div>')
         ]
      },
      'Array content template 3': {
         templateStr: '' +
            '<div>' +
               '<UITest.MarkupSpecification.scope.children-in-template>' +
                  '<ws:some>' +
                     '<ws:case>' +
                        '<ws:Array>' +
                           '<ws:Object>' +
                              '<ws:someTpl>' +
                                 '<UITest.MarkupSpecification.scope.children-inner prop4="777" prop5="888" />' +
                              '</ws:someTpl>' +
                           '</ws:Object>' +
                        '</ws:Array>' +
                     '</ws:case>' +
                  '</ws:some>' +
               '</UITest.MarkupSpecification.scope.children-in-template>' +
            '</div>',
         checkers: [
            checkStr('' +
               '<div>' +
                  '<div>' +
                     '<div>' +
                        '444 555 666 777 888' +
                     '</div>' +
                  '</div>' +
               '</div>')
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