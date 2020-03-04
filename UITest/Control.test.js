/* global describe, it, assert */
define(['UI/Base', 'UI/Utils'], (Base, Utils) => {
   var fromNode = typeof document === 'undefined';

   describe('UITest/Test', () => {
      it('new control', () => {
         var control = new Base.Control({});
         assert.equal(typeof control._template, 'function');
      });
   });

   describe('Base control constructor', () => {
      if (fromNode){
         this.skip();
      }
      var Logger = Utils.Logger;
      var inst, startTime, result, message;
      var errorMessage, errorStub;

      var loggerErrorMock = (msg) => {
         errorMessage = msg;
      };
      before(function () {
         errorMessage = '';
         errorStub = sinon.stub(Logger, 'error').callsFake(loggerErrorMock);
         message = '';
      });

      after(function () {
         errorMessage = '';
         errorStub.restore();
      });

      beforeEach(() => {
         startTime = Date.now();
         errorMessage = '';
         message = '';
      });

      afterEach(() => {
         inst.destroy();
         startTime = null;
      });

      it('Logic parent type check in runtime', () => {
         inst = new Base.Control({_logicParent: "<div></div>"});
         assert.equal(errorMessage, 'Option "_logicParent" is not instance of "Control"');
      });
   });
});
