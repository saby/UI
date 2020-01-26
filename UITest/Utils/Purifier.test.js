define([
   'UI/Utils',
], function(Utils) {

   describe('UI/_utils/Purifier', () => {
      const Purifier = Utils.Purifier;
      const Logger = Utils.Logger;

      describe('purifyInstance', () => {
         let instance;
         let errorMessage;
         const purifyInstance = Purifier.purifyInstance;
         const loggerError = Logger.error;
         const loggerErrorMock = (msg) => {
            errorMessage += msg;
         };

         before(() => {
            instance = {};
            errorMessage = '';
            Logger.error = loggerErrorMock;
         });

         after(() => {
            instance = {};
            errorMessage = '';
            Logger.error = loggerError;
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
      });
   });
});
