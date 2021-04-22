/* global describe, it, assert */
define([
   'UI/Utils',
], function(Utils) {
   const Logger = Utils.Logger;

   describe('UICommon/_utils/Logger //Started testing log message, please ignore console log', () => {
      let result = '';

      // // template for case
      // describe('Logger => func()', () => {
      //    beforeEach(() => {
      //    });

      //    it('', () => {
      //    });
      // });

      describe('Logger => log()', () => {
         it('send log "info text" ', () => {
            result = Logger.info('info text');
            assert.equal(result.msg, 'info text');
            assert.equal(result.data, 'CONTROL INFO: info text');
         });
         it('send log without param', () => {
            result = Logger.info();
            assert.equal(result.msg, '');
            assert.equal(result.data, 'CONTROL INFO: ');
         });
         it('send log "null"', () => {
            result = Logger.info(null);
            assert.equal(result.msg, null);
            assert.equal(result.data, 'CONTROL INFO: null');
         });
      });

      describe('Logger => warn()', () => {
         it('send warn "warn text" ', () => {
            result = Logger.warn('warn text');
            assert.equal(result.msg, 'warn text');
            assert.equal(result.data, 'CONTROL WARNING: warn text');
         });
         it('send warn without param', () => {
            result = Logger.warn();
            assert.equal(result.msg, '');
            assert.equal(result.data, 'CONTROL WARNING: ');
         });
         it('send warn "null"', () => {
            result = Logger.warn(null);
            assert.equal(result.msg, null);
            assert.equal(result.data, 'CONTROL WARNING: null');
         });
      });

      describe('Logger => error()', () => {
         it('send error "error text" ', () => {
            result = Logger.error('error text');
            assert.equal(result.msg, 'error text');
            assert.equal(result.data, 'CONTROL ERROR: error text');
         });
         it('send error without param', () => {
            result = Logger.error();
            assert.equal(result.msg, '');
            assert.equal(result.data, 'CONTROL ERROR: IN _createFakeError');
         });
         it('send error "null"', () => {
            result = Logger.error(null);
            assert.equal(result.msg, null);
            assert.equal(result.data, 'CONTROL ERROR: IN _createFakeError');
         });
         it('get error object', () => {
            result = Logger.error('error');
            let stack = result.errorInfo.stack;
            let msg = result.errorInfo.message;
            let name = result.errorInfo.name;
            assert.ok(stack);
            assert.equal(msg, '');
            assert.equal(name, 'Error');
         });
      });

      describe('Logger => lifeError()', () => {
         it('send error "error text" ', () => {
            result = Logger.lifeError('error text');
            assert.equal(result.msg, 'LIFECYCLE ERROR: IN "_createFakeError". HOOK NAME: "error text"');
         });
         it('send error without param', () => {
            result = Logger.lifeError();
            assert.equal(result.msg, 'LIFECYCLE ERROR: IN "_createFakeError". HOOK NAME: "[not detected]"');
         });
         it('send error "null"', () => {
            result = Logger.lifeError(null);
            assert.equal(result.msg, 'LIFECYCLE ERROR: IN "_createFakeError". HOOK NAME: "null"');
         });
         it('get error object', () => {
            result = Logger.lifeError('error text');
            let stack = result.errorInfo.stack;
            let msg = result.errorInfo.message;
            let name = result.errorInfo.name;
            assert.ok(stack);
            assert.equal(msg, '');
            assert.equal(name, 'Error');
         });
      });

      describe('Logger => templateError()', () => {
         it('send error "error text" ', () => {
            result = Logger.templateError('error text', '_createFakeError');
            assert.equal(result.msg, 'TEMPLATE ERROR: error text IN "_createFakeError"');
         });
         it('send error without param', () => {
            result = Logger.templateError();
            assert.equal(result.msg, 'TEMPLATE ERROR:  IN "[not detected]"');
         });
         it('send error "null"', () => {
            result = Logger.templateError(null);
            assert.equal(result.msg, 'TEMPLATE ERROR: null IN "[not detected]"');
         });
         it('get error object', () => {
            result = Logger.templateError('error text');
            let stack = result.errorInfo.stack;
            let msg = result.errorInfo.message;
            let name = result.errorInfo.name;
            assert.ok(stack);
            assert.equal(msg, '');
            assert.equal(name, 'Error');
         });
      });

      describe('Logger => setDebug()', () => {
         it('enabled debug mode', () => {
            const state = Logger.setDebug(true);
            assert.isTrue(state);
         });
         it('disabled debug mode', () => {
            const state = Logger.setDebug(false);
            assert.isTrue(!state);
         });
      });

      describe('Logger => debug()', () => {
         beforeEach(() => {
            Logger.setDebug(true);
         });

         it('send empty debug message', () => {
            result = Logger.debug();
            assert.equal(result.msg, '');
            assert.equal(result.logMsg, 'CONTROL DEBUG:  ');
         });

         it('send custom debug message without data', () => {
            result = Logger.debug('debug!!!');
            assert.equal(result.msg, 'debug!!!');
            assert.equal(result.logMsg, 'CONTROL DEBUG: debug!!! ');
         });

         it('send custom debug message with data', () => {
            let data = { msg: 'test1', data: {} };
            result = Logger.debug('debug!', data);
            assert.equal(result.msg, 'debug!');
            assert.equal(result.logMsg, 'CONTROL DEBUG: debug! \n{"msg":"test1","data":{}}');
         });

         afterEach(() => {
            Logger.setDebug(false);
         });
      });
   });
});
