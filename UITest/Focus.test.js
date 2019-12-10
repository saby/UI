/* global describe, it, assert */
define([
   'UI/Focus',
   'UI/Base',
   'Env/Env',
   'UI/_focus/_ResetScrolling',
   'UITest/Focus'
], function(
   Focus,
   Base,
   Env,
   _ResetScrolling,
   FocusTestControls
) {
   'use strict';

   var global = (function() {
      return this || (0, eval)('this');
   }());

   describe('Focus', function() {
      var div;
      var control;
      var globalCases = [];
      var currentCase;
      var fromNode = typeof document === 'undefined';

      before(function(done) {
         if (fromNode) {
            require(['jsdom'], function(jsdom) {
               var browser = new jsdom.JSDOM('', { pretendToBeVisual: true });
               global.window = browser.window;
               global.document = window.document;
               global.Element = window.Element;
               global.HTMLElement = window.HTMLElement;
               global.SVGElement = window.SVGElement;
               global.Node = window.Node;
               global.getComputedStyle = window.getComputedStyle;
               Focus._initFocus();
               done();
            });
         } else {
            done();
         }
      });

      after(function() {
         if (fromNode) {
            delete global.window;
            delete global.document;
            delete global.Element;
            delete global.HTMLElement;
            delete global.SVGElement;
            delete global.Node;
            delete global.getComputedStyle;
         }
      });

      beforeEach(function(done) {
         // Run these tests in browser only
         if (!fromNode) {
            this.skip();
         }

         currentCase = globalCases.shift();
         div = document.createElement('div');
         document.body.appendChild(div);
         var ctr = currentCase.control;
         if (ctr) {
            Base.Creator(ctr, {
               afterMountCallback: function() {
                  control = div.controlNodes[0].control;
                  control._mounted = true;
                  done();
               },
               fromNode: fromNode,
               testName: currentCase.name
            }, div);
         } else {
            done();
         }
      });

      afterEach(function() {
         if (control) {
            control.destroy();
         }
         document.body.removeChild(div);
      });

      describe('activate', function() {
         var localCases = [
            {
               control: FocusTestControls.Simple,
               name: 'simple',
               checkFn: function() {
                  assert.ok(Focus.activate(div));
                  assert.strictEqual(document.activeElement, div);
               }
            },
            {
               control: FocusTestControls.MinusOneTabindex,
               name: 'tabindex="-1"',
               checkFn: function() {
                  assert.notOk(Focus.activate(div));
                  assert.strictEqual(document.activeElement, document.body);
               }
            },
            {
               control: FocusTestControls.DelegatedTabfocus,
               name: 'delegates tabfocus',
               checkFn: function() {
                  assert.ok(Focus.activate(document.getElementById('start focus it')));
                  assert.strictEqual(document.activeElement, document.getElementById('delegated'));
               }
            },
            {
               control: FocusTestControls.SvgWithNoFocus,
               name: 'focus SVG Element',
               checkFn: function() {
                  assert.ok(Focus.activate(div));
                  assert.strictEqual(document.activeElement, document.body);
               }
            },
            {
               control: FocusTestControls.AutofocusInside,
               name: 'has autofocus control inside',
               checkFn: function() {
                  assert.ok(Focus.activate(div));
                  assert.strictEqual(document.activeElement, control._children.autofocusChild._container);
               }
            },
            {
               control: FocusTestControls.ConditionContent,
               name: 'restore focus after remove',
               async: true,
               checkFn: function(done) {
                  try {
                     control.afterUpdateCallback = function() {
                        assert.strictEqual(document.activeElement, div);
                        done();
                     };
                     var container = document.getElementById('start');
                     assert.ok(Focus.activate(container));
                     assert.strictEqual(document.activeElement, container);
                     control.noNeedContent = true;
                  } catch (e) {
                     done(e);
                  }
               }
            },
            {
               control: FocusTestControls.Deactivate,
               name: 'deactivate event',
               checkFn: function() {
                  assert.ok(Focus.activate(document.getElementById('first')));
                  assert.ok(Focus.activate(document.getElementById('second')));
                  assert.strictEqual(control.lastDeactivatedName, 'first');
               }
            },
            {
               control: FocusTestControls.WithInputFakeMobile,
               name: 'focus textarea in mobile platform',
               checkFn: function() {
                  assert.ok(Focus.activate(document.getElementById('textarea')));
                  assert.strictEqual(document.activeElement, div);
               }
            },
            {
               control: FocusTestControls.WithInputFakeMobile,
               name: 'focus input with type text in mobile platform',
               checkFn: function() {
                  assert.ok(Focus.activate(document.getElementById('inputText')));
                  assert.strictEqual(document.activeElement, div);
               }
            },
            {
               control: FocusTestControls.WithInputFakeMobile,
               name: 'focus textarea in mobile platform 2',
               checkFn: function() {
                  assert.ok(Focus.activate(document.getElementById('contentEditableTrue')));
                  assert.strictEqual(document.activeElement, div);
               }
            }
         ];

         globalCases = globalCases.concat(localCases);

         for (var i = 0; i < localCases.length; ++i) {
            it(localCases[i].name || `test localCases[${i}]`, function(done) {
               currentCase.checkFn(done);
               if (!currentCase.async) {
                  done();
               }
            });
         }
      });

      describe('DefaultOpenerFinder', function() {
         var localCases = [
            {
               name: 'from control',
               control: FocusTestControls.WithDefaultOpener,
               checkFn: function() {
                  var startControl = control._children.start;
                  var goodDefaultOpener = control._children.defaultOpener;
                  var checkDefaultOpener = Focus.DefaultOpenerFinder.find(startControl);
                  assert.strictEqual(goodDefaultOpener, checkDefaultOpener);
               }
            },
            {
               name: 'from element',
               control: FocusTestControls.WithDefaultOpener,
               checkFn: function() {
                  div;
                  var element = document.getElementById('simple');
                  var goodDefaultOpener = control._children.defaultOpener;
                  var checkDefaultOpener = Focus.DefaultOpenerFinder.find(element);
                  assert.strictEqual(goodDefaultOpener, checkDefaultOpener);
               }
            },
            {
               name: 'from jquery element',
               control: FocusTestControls.WithDefaultOpener,
               checkFn: function() {
                  var fakeJqueryElement = [document.getElementById('simple')];
                  var goodDefaultOpener = control._children.defaultOpener;
                  var checkDefaultOpener = Focus.DefaultOpenerFinder.find(fakeJqueryElement);
                  assert.strictEqual(goodDefaultOpener, checkDefaultOpener);
               }
            }
         ];

         globalCases = globalCases.concat(localCases);

         for (var i = 0; i < localCases.length; ++i) {
            it(localCases[i].name || `test localCases[${i}]`, function(done) {
               currentCase.checkFn(done);
               if (!currentCase.async) {
                  done();
               }
            });
         }
      });

      describe('_ResetScrolling', function() {
         var localCases = [
            {
               name: 'for container',
               control: FocusTestControls.Simple,
               checkFn: function() {
                  var container = div;
                  document.body.scrollTop = 13;
                  var undoScrollingFunction = _ResetScrolling.collectScrollPositions(container);
                  document.body.scrollTop = 0;
                  assert.strictEqual(0, document.body.scrollTop);
                  undoScrollingFunction();
                  assert.strictEqual(13, document.body.scrollTop);
               }
            },
            {
               name: 'for array',
               control: FocusTestControls.Simple,
               checkFn: function() {
                  var container = [div];
                  document.body.scrollTop = 13;
                  var undoScrollingFunction = _ResetScrolling.collectScrollPositions(container);
                  document.body.scrollTop = 0;
                  assert.strictEqual(0, document.body.scrollTop);
                  undoScrollingFunction();
                  assert.strictEqual(13, document.body.scrollTop);
               }
            },
            {
               name: 'for pseudo array',
               control: FocusTestControls.Simple,
               checkFn: function() {
                  var container = { 0: div, length: 1 };
                  document.body.scrollTop = 13;
                  var undoScrollingFunction = _ResetScrolling.collectScrollPositions(container);
                  document.body.scrollTop = 0;
                  assert.strictEqual(0, document.body.scrollTop);
                  undoScrollingFunction();
                  assert.strictEqual(13, document.body.scrollTop);
               }
            },
            {
               name: 'for query selector string',
               control: FocusTestControls.Simple,
               checkFn: function() {
                  var container = '#simple';
                  document.body.scrollTop = 13;
                  var undoScrollingFunction = _ResetScrolling.collectScrollPositions(container);
                  document.body.scrollTop = 0;
                  assert.strictEqual(0, document.body.scrollTop);
                  undoScrollingFunction();
                  assert.strictEqual(13, document.body.scrollTop);
               }
            }
         ];

         globalCases = globalCases.concat(localCases);

         for (var i = 0; i < localCases.length; ++i) {
            it(localCases[i].name || `test localCases[${i}]`, function(done) {
               currentCase.checkFn(done);
               if (!currentCase.async) {
                  done();
               }
            });
         }
      });

      describe('PreventFocus', function() {
         var localCases = [
            {
               name: 'need prevent',
               checkFn: function() {
                  div.innerHTML = '<div ws-no-focus="true"><div><div id="start"><div></div></div>';
                  var wasPrevented = false;
                  var event = {
                     target: document.getElementById('start'),
                     preventDefault: function() {
                        wasPrevented = true;
                     }
                  };
                  Focus.preventFocus(event);
                  assert.ok(wasPrevented);
               }
            },
            {
               name: 'no need prevent',
               checkFn: function() {
                  div.innerHTML = '<div><div><div id="start"><div></div></div>';
                  var wasPrevented = false;
                  var event = {
                     target: document.getElementById('start'),
                     preventDefault: function() {
                        wasPrevented = true;
                     }
                  };
                  Focus.preventFocus(event);
                  assert.notOk(wasPrevented);
               }
            }
         ];

         globalCases = globalCases.concat(localCases);

         for (var i = 0; i < localCases.length; ++i) {
            it(localCases[i].name || `test localCases[${i}]`, function(done) {
               currentCase.checkFn(done);
               if (!currentCase.async) {
                  done();
               }
            });
         }
      });

      describe('BoundElements', function() {
         var localCases = [
            {
               name: 'vdom-focus-in',
               control: FocusTestControls.Input,
               checkFn: function() {
                  var vdomfocusin = document.getElementsByClassName('vdom-focus-in');
                  var vdomfocusinElement = vdomfocusin.length ? vdomfocusin[0] : null;
                  var keyCode = 0;
                  vdomfocusinElement.addEventListener('keydown', function(e) {
                     keyCode = e.keyCode;
                  });
                  vdomfocusinElement.focus();
                  assert.strictEqual(keyCode, 9); // tab
               }
            },
            {
               name: 'vdom-focus-out',
               control: FocusTestControls.Input,
               checkFn: function() {
                  var vdomfocusout = document.getElementsByClassName('vdom-focus-out');
                  var vdomfocusoutElement = vdomfocusout.length ? vdomfocusout[0] : null;
                  var keyCode = 0;
                  vdomfocusoutElement.addEventListener('keydown', function(e) {
                     keyCode = e.keyCode;
                  });
                  vdomfocusoutElement.focus();
                  assert.strictEqual(keyCode, 9); // tab
               }
            }
         ];

         globalCases = globalCases.concat(localCases);

         for (var i = 0; i < localCases.length; ++i) {
            it(localCases[i].name || `test localCases[${i}]`, function(done) {
               currentCase.checkFn(done);
               if (!currentCase.async) {
                  done();
               }
            });
         }
      });

      describe('Focus method', function() {
         var localCases = [
            {
               name: 'makeResetScrollFunction',
               checkFn: function() {
                  div.innerHTML = '<div id="input" contenteditable="true"></div>';
                  var input = document.getElementById('input');
                  var scrolled = false;

                  var detection = Env.detection;
                  Env.detection = {
                     safari: true,
                     isMobileIOS: true,
                     isMobilePlatform: true
                  };

                  var collectScrollPositions = _ResetScrolling.collectScrollPositions;
                  _ResetScrolling.collectScrollPositions = function() {
                     scrolled = true;
                     return function() { };
                  };

                  try {
                     Focus.focus(input, {
                        enableScreenKeyboard: true
                     });
                  } finally {
                     Env.detection = detection;
                     _ResetScrolling.collectScrollPositions = collectScrollPositions;
                  }
                  assert.notOk(scrolled);

                  // assert.strictEqual(document.activeElement, input);
               }
            },
            {
               name: 'no call HTMLElement.focus if focus() on element redefined',
               async: true,
               checkFn: function(done) {
                  assert.notOk(false);
                  div.innerHTML = '<div id="input" contenteditable="true"></div>';
                  var input = document.getElementById('input');
                  var overridedFocusCalled = false;
                  input.focus = function() { overridedFocusCalled = true };
                  var originFocus = HTMLElement.prototype.focus;
                  var nativeFocusCalled = false;
                  HTMLElement.prototype.focus = function() {
                     nativeFocusCalled = true;
                  }
                  try {
                     Focus.focus(input);
                     assert.notOk(nativeFocusCalled);
                     assert.ok(overridedFocusCalled);
                     done();
                  } catch(e) {
                     done(e);
                  } finally {
                     HTMLElement.prototype.focus = originFocus;
                  }
               }
            }
         ];

         globalCases = globalCases.concat(localCases);

         for (var i = 0; i < localCases.length; ++i) {
            it(localCases[i].name || `test localCases[${i}]`, function(done) {
               currentCase.checkFn(done);
               if (!currentCase.async) {
                  done();
               }
            });
         }
      });
   });
});
