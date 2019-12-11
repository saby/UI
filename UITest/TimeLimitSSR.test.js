/* global require, define, describe, it, assert */
define([
   'UI/Base'
], function(Base) {
   'use strict';

   describe('Test Server Side Render time manager', () => {
      let fromNode = typeof document === 'undefined';

      describe('UI/Base:HeadData', () => {
         it('Execute time is below time limit', (done) => {
            var headData = new Base.HeadData;
            headData.ssrEndTime = Date.now() + 40;
            setTimeout( () => {
               assert.isAbove(headData.ssrWaitTimeManager(), 0, 'Ok');
               done();
            }, 10);
         }).timeout(20);

         it('Execute time is above time limit', (done) => {
            var headData = new Base.HeadData;
            headData.ssrEndTime = Date.now() + 20;
            setTimeout(() => {
               assert.strictEqual(headData.ssrWaitTimeManager(), 0, 'Ok');
               done();
            }, 40);
         }).timeout(50);
      });

      describe('UI/Base:Control', function() {
         let globalTimer, inst, beforeMount, waitTime, resultPromise, headData;

         var global = (function() {
            return this || (0, eval)('this');
         }());

         describe('Promise in _beforeMount', function() {
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
      });
   });
});
