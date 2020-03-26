define([
   'UI/Utils',
   'Env/Env'
], function(Utils,
            Env
   ) {

   describe('UI/_utils/Purifier', () => {
      const Purifier = Utils.Purifier;
      const Logger = Utils.Logger;
      const cookie = Env.cookie;
      describe('purifyInstance', () => {
         let instance;
         let errorMessage;
         let warnStub;
         let cookieStub;
         const purifyInstance = Purifier.purifyInstance;
         const loggerErrorMock = (msg) => {
            errorMessage += msg;
         };
         const cookieGetMock = (name) => name === 's3debug';

         before(() => {
            instance = {};
            errorMessage = '';
            warnStub = sinon.stub(Logger, 'warn').callsFake(loggerErrorMock);
            cookieStub = sinon.stub(cookie, 'get').callsFake(cookieGetMock);
         });

         after(() => {
            instance = {};
            errorMessage = '';
            warnStub.restore();
            cookieStub.restore();
         });

         beforeEach(() => {
            errorMessage = '';
            instance = {
               stringValue: 'some string',
               numberValue: 31415,
               booleanValue: true,
               undefinedValue: undefined,
               nullValue: null,
               objectValue: {key: 'value'},
               functionValue: (arg) => !!arg
            };
            purifyInstance(instance, 'test_instance', false);
         });

         it('string value', () => {
            instance.stringValue = 'another string';
            assert.equal(errorMessage, '');

            const stringValue = instance.stringValue;
            assert.equal(stringValue, 'some string');
            assert.equal(errorMessage, '');
         });

         it('number value', () => {
            instance.numberValue = 9265;
            assert.equal(errorMessage, '');

            const numberValue = instance.numberValue;
            assert.equal(numberValue, 31415);
            assert.equal(errorMessage, '');
         });

         it('undefined value', () => {
            instance.undefinedValue = 'defined';
            assert.equal(errorMessage, '');

            const undefinedValue = instance.undefinedValue;
            assert.strictEqual(undefinedValue, undefined);
            assert.equal(errorMessage, '');
         });

         it('null value', () => {
            instance.nullValue = { a: 'b' };
            assert.equal(errorMessage, '');

            const nullValue = instance.nullValue;
            assert.strictEqual(nullValue, null);
            assert.equal(errorMessage, '');
         });

         it('object value', () => {
            instance.objectValue = { a: 'b' };
            assert.equal(errorMessage, '');

            const objectValue = instance.objectValue;
            assert.strictEqual(objectValue, undefined);
            assert.equal(errorMessage, 'Попытка получить поле objectValue в очищенном test_instance');
         });

         it('function value', () => {
            instance.functionValue = () => {};
            assert.equal(errorMessage, '');

            const functionValue = instance.functionValue;
            assert.strictEqual(functionValue, undefined);
            assert.equal(errorMessage, 'Попытка получить поле functionValue в очищенном test_instance');
         });

         it('no enumerable properties', () => {
            instance.newValue = 'Expelliarmus!';
            assert.equal(errorMessage, '');
            assert.equal(Object.keys(instance).length, 0);
         });

         it('purify instance more than once', () => {
            purifyInstance(instance);
            assert.equal(errorMessage, '');
         });

         it('purify instance with a prototype', () => {
            const proproto = {
               c: {}
            };
            const proto = {
               b: {}
            };
            instance = {
               a: {}
            };
            Object.setPrototypeOf(proto, proproto);
            Object.setPrototypeOf(instance, proto);
            purifyInstance(instance, 'test_instance');
            const valueA = instance.a;
            const errorMessageA = 'Попытка получить поле a в очищенном test_instance';
            const valueB = instance.b;
            const errorMessageB = 'Попытка получить поле b в очищенном test_instance';
            const valueC = instance.c;
            const errorMessageC = 'Попытка получить поле c в очищенном test_instance';
            assert.strictEqual(valueA, undefined);
            assert.strictEqual(valueB, undefined);
            assert.strictEqual(valueC, undefined);
            assert.equal(errorMessage, errorMessageA + errorMessageB + errorMessageC);
         });

         it('purify instance with a getter (string)', () => {
            instance = {
               a: 'a',
               z: 'z'
            };
            Object.defineProperty(instance, 'getterValue', {
               get: () => instance.a + instance.z,
               configurable: true,
               enumerable: true
            });
            purifyInstance(instance);

            const getterValue = instance.getterValue;
            assert.equal(getterValue, 'az');
            assert.equal(errorMessage, '');
         });

         it('purify instance with a getter (object)', () => {
            instance = {
               a: 'a',
               z: 'z'
            };
            Object.defineProperty(instance, 'getterValue', {
               get: () => ({
                  a: instance.z,
                  z: instance.a
               }),
               configurable: true,
               enumerable: true
            });
            purifyInstance(instance, 'test_instance');

            const getterValue = instance.getterValue;
            assert.strictEqual(getterValue, undefined);
            assert.equal(errorMessage, 'Попытка получить поле getterValue в очищенном test_instance');
         });

         it('do not purify some state', () => {
            instance = {
               safeState: {},
               unsafeState: {
                  value: new Date()
               }
            };
            purifyInstance(instance, 'test_instance', false, { safeState: true });

            const safeState = instance.safeState;
            const unsafeState = instance.unsafeState;
            assert.equal(typeof safeState, 'object');
            assert.equal(typeof unsafeState, 'undefined');
            assert.equal(errorMessage, 'Попытка получить поле unsafeState в очищенном test_instance');
         });
      });
   });
});
