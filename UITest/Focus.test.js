define([
   'UI/Focus',
   'UI/Base',
   'UITest/Focus'
], function (Focus,
             Base,
             FocusTestControls
) {
   'use strict';

   var global = function () {
      return this || (0, eval)('this');
   }();

   describe('Focus', function () {
      var div;
      var control;
      var cases;
      var currentCase;

      before(function (done) {
         if (typeof document === 'undefined') {
            requirejs(['jsdom'], function (jsdom) {
               var browser = new jsdom.JSDOM('', { pretendToBeVisual: true });
               global.window = browser.window;
               global.document = window.document;
               global.HTMLElement = window.HTMLElement;
               global.SVGElement = window.SVGElement;
               global.Node = window.Node;
               global.getComputedStyle = window.getComputedStyle;
               done();
            });
         } else {
            done();
         }
      });

      beforeEach(function(done) {
         currentCase = cases.shift();
         div = document.createElement('div');
         document.body.appendChild(div);
         var ctr = currentCase.control;
         if (ctr) {
            Base.Creator(ctr, {
               afterMountCallback: function() {
                  control = div.controlNodes[0].control;
                  control._mounted = true;
                  done();
               }
            }, div);
         } else {
            done();
         }
      });

      afterEach(function () {
         if (control) {
            control.destroy();
         }
         document.body.removeChild(div);
      });

      describe('activate', function() {
         cases = [
            {
               control: FocusTestControls.Simple,
               name: 'simple',
               checkFn: function() {
                  assert.ok(Focus.activate(div));
                  assert.ok(document.activeElement === div);
               }
            },
            {
               control: FocusTestControls.MinusOneTabindex,
               name: 'tabindex="-1"',
               checkFn: function() {
                  assert.notOk(Focus.activate(div));
                  assert.ok(document.activeElement === document.body);
               }
            },
            {
               control: FocusTestControls.AutofocusInside,
               name: 'has autofocus control inside',
               checkFn: function() {
                  assert.ok(Focus.activate(div));
                  assert.ok(document.activeElement === control._children['autofocusChild']._container);
               }
            }
         ];

         for (var i = 0; i < cases.length; ++i) {
            it(cases[i].name || `test cases[${i}]`, function(done) {
               currentCase.checkFn(done);
               done();
            })
         }
      });
   });
});
