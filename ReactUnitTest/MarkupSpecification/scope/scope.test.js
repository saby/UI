define([
   'ReactUnitTest/MarkupSpecification/testing',
   'ReactUnitTest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'Delegate attributes into control': {
         templateStr: '<ReactUnitTest.MarkupSpecification.scope.twoRootsControl attr:class="mom" name="witch" />',
         checkers: [
            checkStr('<div class="mom" name="witch" id="vdomClass"></div>')
         ],
         vdomOnly: true
      },
      'Array content template 1': {
         templateStr: '' +
            '<div>' +
            '   <ReactUnitTest.MarkupSpecification.scope.children-some>' +
            '      <ws:someTpl>' +
            '         <ReactUnitTest.MarkupSpecification.scope.children-inner prop4="777" prop5="888" />' +
            '      </ws:someTpl>' +
            '   </ReactUnitTest.MarkupSpecification.scope.children-some>' +
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
               '<ReactUnitTest.MarkupSpecification.scope.children-in-template>' +
                  '<ws:some>' +
                     '<ws:case>' +
                        '<ws:Array>' +
                           '<ws:Object>' +
                              '<ws:someTpl>' +
                                 '<ReactUnitTest.MarkupSpecification.scope.children-inner prop4="777" prop5="888" />' +
                              '</ws:someTpl>' +
                           '</ws:Object>' +
                        '</ws:Array>' +
                     '</ws:case>' +
                  '</ws:some>' +
               '</ReactUnitTest.MarkupSpecification.scope.children-in-template>' +
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
               '<ReactUnitTest.MarkupSpecification.scope.children-in-template>' +
                  '<ws:some>' +
                     '<ws:case>' +
                        '<ws:Array>' +
                           '<ws:Object>' +
                              '<ws:someTpl>' +
                                 '<ReactUnitTest.MarkupSpecification.scope.children-inner prop4="777" prop5="888" />' +
                              '</ws:someTpl>' +
                           '</ws:Object>' +
                        '</ws:Array>' +
                     '</ws:case>' +
                  '</ws:some>' +
               '</ReactUnitTest.MarkupSpecification.scope.children-in-template>' +
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
      'String options setting': {
         templateStr: '' +
            '<ws:template name="a">{{b}} {{str}}</ws:template>' +
            '<ws:partial template="a" scope="{{data}}">' +
               '<ws:b>' +
                  '<ws:String>string</ws:String>' +
               '</ws:b>' +
            '</ws:partial>',
         checkers: checkStr('string string2'),
         executionConfig: {
            data: {
               data: {
                  str: 'string2'
               }
            }
         },
      },
   };

   describe('Markup!', () => {
      Testing.runTests(tests);
   });
});
