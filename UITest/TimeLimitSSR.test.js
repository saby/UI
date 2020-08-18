/* global require, define, describe, it, assert */
define([
   'UI/Base'
], function(Base) {
   'use strict';

   describe('Test Server Side Render time manager', () => {
      let fromNode = typeof document === 'undefined';

      describe('UI/Base:HeadData', () => {
         it('ssrTimeout returns rest ssr delay', (done) => {
            const headData = new Base.HeadData();
            setTimeout(() => {
               assert.isAbove(headData.ssrTimeout, 0, 'ssrTimeout returns rest ssr timeout');
               done();
            }, Base.HeadData.SSR_DELAY / 2 );
         }).timeout(Base.HeadData.SSR_DELAY / 2 + 100);

         it('ssrTimeout returns 0 after ssr timeout', (done) => {
            const headData = new Base.HeadData();
            setTimeout(() => {
               assert.strictEqual(headData.ssrTimeout, 0, 'ssrTimeout returns 0 after ssr timeout');
               done();
            }, Base.HeadData.SSR_DELAY + 100);
         }).timeout(Base.HeadData.SSR_DELAY + 200);
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
