import * as React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { createSandbox } from 'sinon';
import { assert } from 'chai';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import TestControl from './Container';
import TestControl2 from './Container2';
describe('Тесты работы ключей в шаблонизаторе', () => {
    let container;
    let sandbox;

    // не выношу это в describe повыше, чтобы тесты построения на сервере не нужно было выносить в отдельный файл
    before(() => {
        const browser = new JSDOM();
        global.window = browser.window;
        global.document = window.document;
    });

    after(() => {
        delete global.window;
        delete global.document;
    });

    let clock;
    beforeEach(() => {
        sandbox = createSandbox();
        /*
        _afterMount и _afterUpdate зовутся в отдельной таске, чтобы браузер мог отрисовать кадр.
        Чтобы не делать тесты асинхронными, мы просто мокнем таймеры и сами будем управлять временем.
         */
        clock = sandbox.useFakeTimers();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
        unmountComponentAtNode(container);
        container.remove();
        container = null;
    });

    /**
     * Эта функция существует для того, чтобы не забывать оборачивать тики в act.
     * Это нужно, чтобы реакт реагировал на изменение времени и обновлял компоненты.
     * @param duration Значение, на которое должно продвинуться время.
     */
    function tick(duration: number): void {
        act(() => {
            clock.tick(duration);
        });
    }

    /**
     * Асинхронный аналог {@link tick}, отличается тем, что эта версия позволяет выполниться коллбекам промисов.
     * @param duration Значение, на которое должно продвинуться время.
     */
    async function tickAsync(duration: number): Promise<void> {
        return act(async () => {
            // в новой версии sinon есть clock.tickAsync, который в теории делает то же самое
            clock.tick(duration);
            await Promise.resolve();
        });
    }

    it('Выставленные ключи для контролов внутри цикла позволяют избежать лишних перерисовок контролов', async () => {
        let inst;
        act(() => {
            inst = render(<TestControl />, container);
        });
        await tickAsync(0);
        await tickAsync(0);
        inst.keys = [2,3,4,5];
        await tickAsync(0);
        await tickAsync(0);
        inst.keys = [3,4,5];
        await tickAsync(0);
        await tickAsync(0);
        inst.keys = [4,5];
        await tickAsync(0);
        await tickAsync(0);

        // потому что в реакте componentDidUpdate реально срабатывает
        // https://codesandbox.io/s/react-list-sample-map-with-keys-forked-ldi42
        assert.equal(inst._children.item_5.updated, 3);
    });

    it('Выставленные ключи для контролов внутри цикла позволяют избежать лишних перерисовок контролов 2', async () => {
        let inst;
        act(() => {
            inst = render(<TestControl2 />, container);
        });
        await tickAsync(0);
        await tickAsync(0);
        inst.keys = [2,3,4,5];
        await tickAsync(0);
        await tickAsync(0);
        inst.keys = [3,4,5];
        await tickAsync(0);
        await tickAsync(0);
        inst.keys = [4,5];
        await tickAsync(0);
        await tickAsync(0);

        assert.equal(inst._children.item_5.updated, 3);
    });
});
