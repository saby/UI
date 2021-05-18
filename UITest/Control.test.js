/* global describe, it, assert */
define(['UI/Base', 'UI/Utils', 'UICore/_base/Control'], (Base, Utils, Private) => {
   var fromBrowser = typeof document !== 'undefined';

   var describeIf = function(condition) {
      return condition ? describe : describe.skip;
   };

   describe('UITest/Test', () => {
      it('new control', () => {
         var control = new Base.Control({});
         assert.equal(typeof control._template, 'function');
      });
   });

   describeIf(fromBrowser)('Async _beforeMount on client', () => {
      var Logger = Utils.Logger;
      var _privateFromControl, startTime, beforeMount, result, message;
      var warnMessage, errorMessage, warnStub, errorStub;
      var loggerWarnMock = (msg) => {
         warnMessage = msg;
      };
      var loggerErrorMock = (msg) => {
         errorMessage = msg;
      };
      before(() => {
         warnMessage = '';
         warnStub = sinon.stub(Logger, 'warn').callsFake(loggerWarnMock);
         errorMessage = '';
         errorStub = sinon.stub(Logger, 'error').callsFake(loggerErrorMock);
         message = '';
      });

      after(() => {
         warnMessage = '';
         warnStub.restore();
         errorMessage = '';
         errorStub.restore();
      });

      beforeEach(function() {
         _privateFromControl = Private._private;
         startTime = Date.now();
         warnMessage = '';
         errorMessage = '';
         message = '';
      });

      afterEach(() => {
         _privateFromControl = null;
         startTime = null;
      });

      it('Default BL Execute Timer', () => {
         startTime = startTime - 1000;
         result = _privateFromControl._checkAsyncExecuteTime(startTime, undefined);
         assert.equal(warnMessage, '');
      });

      it('Default BL Execute Timer - warn', () => {
         startTime = startTime - 10000;
         result = _privateFromControl._checkAsyncExecuteTime(startTime, undefined);
         message = `Долгое выполнение _beforeMount на клиенте!`;
         assert.include(warnMessage, message);
      });

      it('Custom BL Execute Timer', () => {
         startTime = startTime - 8000;
         result = _privateFromControl._checkAsyncExecuteTime(startTime, 10000);
         assert.equal(warnMessage, '');
      });

      it('Custom BL Execute Timer - warn', () => {
         startTime = startTime - 10000;
         result = _privateFromControl._checkAsyncExecuteTime(startTime, 6000);
         message = `Долгое выполнение _beforeMount на клиенте!`;
         assert.include(warnMessage, message);
      });

      it('Default control timeout', () => {
         beforeMount = new Promise((resolve) => {
            resolve(true);
         });
         return _privateFromControl._asyncClientBeforeMount(beforeMount, 20000, undefined).then((result) => {
            assert.isTrue(result);
         });
      });

      it('Custom control timeout - error', () => {
         beforeMount = new Promise((resolve) => {
            setTimeout(() => {resolve(true)}, 10);
         });
         message = `Ошибка построения на клиенте!`;
         return _privateFromControl._asyncClientBeforeMount(beforeMount, 0, undefined).then((result) => {
            assert.include(errorMessage, message);
         });
      });
   });
});
