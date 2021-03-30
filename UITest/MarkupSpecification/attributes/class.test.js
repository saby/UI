define([
   'UITest/MarkupSpecification/testing',
   'UITest/MarkupSpecification/asserts'
], (Testing, Asserts) => {
   let checkStr = Asserts.assertMarkup;

   let tests = {
      'Test class stored through inline template': {
         templateStr: '' +
            '<ws:template name="myTpl">' +
            '  <div class="iAmDiv {{className}}">Hi</div>' +
            '</ws:template>' +
            '<ws:partial template="myTpl" className="iAmClass"/>' +
            '<ws:partial template="myTpl" className="iAmClassToo"/>',
         checkers: [
            checkStr('' +
               '<div class="iAmDiv iAmClass">Hi</div>' +
               '<div class="iAmDiv iAmClassToo">Hi</div>')
         ]
      },
      'Test merge classes': {
         templateStr: '' +
            '<ws:template name="myTpl">' +
            '  <div class="innerClass">Text</div>' +
            '</ws:template>' +
            '<ws:partial template="myTpl" attr:class="outerClass"/>',
         checkers: [
            checkStr('' +
               '<div class="innerClass outerClass">Text</div>')
         ]
      },
      'Test merge styles': {
         templateStr: '' +
            '<ws:template name="myTpl">' +
            '  <div style="color: red;">Text</div>' +
            '</ws:template>' +
            '<ws:partial template="myTpl" attr:style="font-size: 13px;"/>',
         checkers: [
            checkStr('' +
               '<div style="color:red;font-size:13px">Text</div>')
         ]
      },
      'Test merge styles 2': {
         templateStr: '' +
            '<ws:template name="myTpl">' +
            '  <div style="\n  \t  color:  \n  \n  red; \t   ">Text</div>' +
            '</ws:template>' +
            '<ws:partial template="myTpl" attr:style=" \n  font-size: \t \n \n  13px; \t \n "/>',
         checkers: [
            checkStr('' +
               '<div style="color:red;font-size:13px">Text</div>')
         ]
      },
      'Test merge styles 3': {
         templateStr: '' +
            '<ws:template name="myTpl">' +
            '  <div style="{{a}}">Text</div>' +
            '</ws:template>' +
            '<ws:partial template="myTpl" attr:style="{{b}}"/>',
         checkers: [
            checkStr('' +
               '<div style="color:red;font-size:13px">Text</div>')
         ],
         executionConfig: {
            data: {
               a: 'color: red;',
               b: 'font-size: 13px;'
            }
         }
      },
      'Test merge styles without end semicolons': {
         templateStr: '' +
            '<ws:template name="myTpl">' +
            '  <div style="color: red">Text</div>' +
            '</ws:template>' +
            '<ws:partial template="myTpl" attr:style="font-size: 13px"/>',
         checkers: checkStr('' +
            '<div style="color:red;font-size:13px">Text</div>')
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
