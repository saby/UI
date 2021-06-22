import { assert } from 'chai';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import { ChainOfRef } from 'UICore/Ref';
import { CustomRef } from './Refs/CustomRef';

const isBrowser = typeof window !== 'undefined';
const describeIf = (condition) => condition ? describe : describe.skip;

describeIf(isBrowser)('Тестирование цепочки ответственностей', () => {
    let container;

    beforeEach(() => {
        /*
        _afterMount и _afterUpdate зовутся в отдельной таске, чтобы браузер мог отрисовать кадр.
        Чтобы не делать тесты асинхронными, мы просто мокнем таймеры и сами будем управлять временем.
         */
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
        container = null;
    });

    describe('Проверяем цепочку из одной ответственности ', () => {
        it('Добавление в цепочку', () => {
            const customRef = new CustomRef();
            const chainOfRef = new ChainOfRef();
            chainOfRef.add(customRef);
            assert.deepEqual(chainOfRef.handlers, [customRef]);
        });

        it('Выполнение цепочки', () => {
            const customRef = new CustomRef();
            const chainOfRef = new ChainOfRef();
            chainOfRef.add(customRef);
            chainOfRef.execute()(container);
            assert.equal(container.count, 0);
        });
    });

    describe('Проверяем цепочку из нескольких ответственностей ', () => {
        it('Добавление в цепочку', () => {
            const customRef0 = new CustomRef();
            const customRef1 = new CustomRef();
            const customRef2 = new CustomRef();
            const chainOfRef = new ChainOfRef();
            chainOfRef.add(customRef0);
            chainOfRef.add(customRef1);
            chainOfRef.add(customRef2);
            assert.deepEqual(chainOfRef.handlers, [customRef0, customRef1, customRef2]);
        });

        it('Добавление в цепочку 2', () => {
            const customRef0 = new CustomRef();
            const customRef1 = new CustomRef();
            const customRef2 = new CustomRef();
            const chainOfRef = new ChainOfRef();
            chainOfRef.add(customRef0).add(customRef1).add(customRef2);
            assert.deepEqual(chainOfRef.handlers, [customRef0, customRef1, customRef2]);
        });

        it('Выполнение цепочки', () => {
            const customRef0 = new CustomRef();
            const customRef1 = new CustomRef();
            const customRef2 = new CustomRef();
            const chainOfRef = new ChainOfRef();
            chainOfRef.add(customRef0).add(customRef1).add(customRef2);
            chainOfRef.execute()(container);
            assert.equal(container.count, 2);
        });
    });
});
