define([
   'UI/Utils',
   'UICommon/_utils/Purifier/needLog'
], function(Utils,
            needLog
   ) {

   describe('UICommon/_utils/Purifier', () => {
      const Purifier = Utils.Purifier;
      const Logger = Utils.Logger;
      describe('purifyInstance', () => {
         let instance;
         let errorMessage;
         let errorStub;
         let isDebugStub;
         let proxyResult;
         const purifyInstance = Purifier.purifyInstance;
         const loggerErrorMock = (msg) => {
            errorMessage += msg;
         };

         before(() => {
            errorStub = sinon.stub(Logger, 'error').callsFake(loggerErrorMock);
            isDebugStub = sinon.stub(needLog, 'default').returns(true);
            instance = {
               a: {}
            };
            purifyInstance(instance);
            proxyResult = instance.a;
            instance = {};
            errorMessage = '';
         });

         after(() => {
            instance = {};
            errorMessage = '';
            errorStub.restore();
            isDebugStub.restore();
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
            var expectedMessage = 'Разрушенный контрол test_instance пытается обратиться к своему полю objectValue. Для предотвращения утечки памяти значение было удалено.' +
            'Избегайте использования полей контрола после его дестроя, дестрой должен быть последней операцией над контролом.';

            instance.objectValue = { a: 'b' };
            assert.equal(errorMessage, expectedMessage);

            const objectValue = instance.objectValue;
            assert.strictEqual(objectValue, proxyResult);
            assert.equal(errorMessage, expectedMessage.repeat(2));
         });

         it('function value', () => {
            var expectedMessage = 'Разрушенный контрол test_instance пытается обратиться к своему полю functionValue. Для предотвращения утечки памяти значение было удалено.' +
            'Избегайте использования полей контрола после его дестроя, дестрой должен быть последней операцией над контролом.';

            instance.functionValue = () => {};
            assert.equal(errorMessage, expectedMessage);

            const functionValue = instance.functionValue;
            assert.strictEqual(functionValue, proxyResult);
            assert.equal(errorMessage, expectedMessage.repeat(2));
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
            assert.strictEqual(getterValue, proxyResult);
            assert.equal(errorMessage, 'Разрушенный контрол test_instance пытается обратиться к своему полю getterValue. Для предотвращения утечки памяти значение было удалено.' +
               'Избегайте использования полей контрола после его дестроя, дестрой должен быть последней операцией над контролом.');
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
            assert.equal(typeof unsafeState, typeof proxyResult);
            assert.equal(errorMessage, 'Разрушенный контрол test_instance пытается обратиться к своему полю unsafeState. Для предотвращения утечки памяти значение было удалено.' +
               'Избегайте использования полей контрола после его дестроя, дестрой должен быть последней операцией над контролом.');
         });
      });
   });
});
