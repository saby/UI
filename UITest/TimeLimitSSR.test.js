/* global require, define, describe, it, assert */
define([
   'UI/Base'
], function(Base) {
   'use strict';

   describe('Test Server Side Render time manager', () => {
      let headData;
      let fromNode = typeof document === 'undefined';

      describe('UI/Base:HeadData', () => {
         beforeEach(() => {
            headData = new Base.HeadData;
            headData.ssrEndTime = Date.now() + 40;
         });

         it('Execute time is below time limit', (done) => {
            setTimeout( () => {
               assert.isAbove(headData.ssrWaitTimeManager(), 0, 'Ok');
               done();
            }, 15);
         }).timeout(25);

         it('Execute time is above time limit', (done) => {
            setTimeout(() => {
               assert.strictEqual(headData.ssrWaitTimeManager(), 0, 'Ok');
               done();
            }, 40);
         }).timeout(50);
      });

      describe('UI/Base:Control', function() {
         let globalTimer, inst, beforeMount, waitTime, resultPromise;

         var global = (function() {
            return this || (0, eval)('this');
         }());

         before((done) => {
            if (fromNode) {
               require(['jsdom'], function(jsdom) {
                  var browser = new jsdom.JSDOM('', { pretendToBeVisual: true });
                  global.window = browser.window;
                  done();
               });
            } else {
               done();
            }
         });

         after(function() {
            if (fromNode) {
               delete global.window;
            }
         });

         describe('Single Promise', function() {
            before(() => {
               inst = new Base.Control();
               headData = new Base.HeadData;
               globalTimer = 40;
            });

            it('Resolve Promise time is 0', (done) => {
               beforeMount = new Promise((resolve) => {
                  setTimeout(() => {
                     resolve(true);
                  }, 0);
               });
               resultPromise = Promise.resolve(inst._resultBeforeMount(beforeMount, globalTimer));
               setTimeout(() => {
                  resultPromise.then((value) => {
                        assert.isTrue(value);
                     });
                     done();
               }, globalTimer);
            }).timeout(globalTimer);

            it('Resolve Promise time is below time limit', (done) => {
               beforeMount = new Promise((resolve) => {
                  setTimeout(() => {
                     resolve(true);
                  }, 20);
               });
               resultPromise = Promise.resolve(inst._resultBeforeMount(beforeMount, globalTimer));
               setTimeout(() => {
                  resultPromise.then((value) => {
                     assert.isTrue(value);
                  });
                  done();
               }, globalTimer);
            }).timeout(globalTimer);
               it('Resolve Promise time is above time limit', (done) => {
                  if(!fromNode) {
                     beforeMount = new Promise((resolve) => {
                        setTimeout(() => {
                           resolve(true);
                        }, 50);
                     });
                     resultPromise = Promise.resolve(inst._resultBeforeMount(beforeMount, globalTimer));
                     setTimeout(() => {
                        resultPromise.then((value) => {
                           assert.isFalse(value);
                        });
                        done();
                     }, globalTimer);
                  }else{
                     done()
                  }
               }).timeout(globalTimer);

         });

         describe('Chained Promise', function () {
            before(() => {
               inst = new Base.Control();
               headData = new Base.HeadData;
               globalTimer = 40;
            });

            beforeEach(() => {
               waitTime = 10;
            });

            for (let i = 1; i < 6; i++) {
               it(`Resolve Promise ${i} times`, (done) => {

                  if(!fromNode) {
                     waitTime = waitTime * i;
                     beforeMount = new Promise((resolve) => {
                        setTimeout(() => {
                           resolve(true);
                        }, waitTime);
                     });
                     resultPromise = Promise.resolve(inst._resultBeforeMount(beforeMount, globalTimer));
                     setTimeout(() => {
                        resultPromise.then((value) => {
                           if (globalTimer > 0) {
                              assert.isTrue(value);
                           } else {
                              assert.isFalse(value);
                           }
                        });
                        globalTimer -= waitTime;
                        if (globalTimer < 0) {
                           globalTimer = 0;
                        }
                        done();
                     }, globalTimer);
                  }else{
                     done();
                  }
               }).timeout(globalTimer);

            }
         });

      });
   });
});
