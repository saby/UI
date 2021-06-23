import * as React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import { act } from 'react-dom/test-utils';
import { createSandbox } from 'sinon';
import { assert } from 'chai';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import OuterControl from './OuterControl';
import CounterControl from './CounterControl';

import { WasabyEvents} from 'UICore/Events';
import { TouchHandlers } from 'UICommon/Events';

describe('Подписки на контролы', () => {
    let container;
    let sandbox;

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

    async function tickAsync(duration: number): Promise<void> {
        return act(async () => {
            // в новой версии sinon есть clock.tickAsync, который в теории делает то же самое
            clock.tick(duration);
            await Promise.resolve();
        });
    }
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
    let eventSystem;
    beforeEach(() => {
        sandbox = createSandbox();
        /*
        _afterMount и _afterUpdate зовутся в отдельной таске, чтобы браузер мог отрисовать кадр.
        Чтобы не делать тесты асинхронными, мы просто мокнем таймеры и сами будем управлять временем.
         */
        clock = sandbox.useFakeTimers();
        container = document.createElement('div');
        document.body.appendChild(container);
        eventSystem = WasabyEvents.initInstance(container);
    });
    afterEach(() => {
        clock.restore();
        sandbox.restore();
        unmountComponentAtNode(container);
        container.remove();
        container = null;
        eventSystem = null;
    });

    it('подписка на нативное событие на контроле должна навешиваться на внутренний контейнер', () => {
        WasabyEvents.initInstance(container);

        act(() => {
            render(<OuterControl/>, container);
        });
        tick(0);

        const element = container.children[0];
        const handlers = element.eventProperties['on:click'];
        const clickHandler = handlers[0].handler.apply(OuterControl.prototype);
        assert.strictEqual(clickHandler, OuterControl.prototype._clickHandler);
    });
    it('Проверка работы обработчика события on:', () => {
        let instance;
        act(() => {
            instance = render(<CounterControl/>, container);
        });
        tick(0);

        const button = container.querySelector('button');
        assert.equal(instance.clickCount, '0');

        act(() => {
            button.dispatchEvent(new window.MouseEvent('click', {bubbles: true}));
        });
        tick(0);

        assert.equal(instance.clickCount,'1');
    });


    it('Проверяем события тача', async () => {
        global.navigation = { maxTouchPoints: 1 };
        const originalTouchState = TouchHandlers.shouldUseClickByTap;
        TouchHandlers.shouldUseClickByTap = () => {
            return true;
        };

        let instance;
        act(() => {
            instance = render(<CounterControl/>, container);
        });
        tick(0);

        const button = container.querySelector('button');
        assert.equal(instance.clickCount, '0');

        act(() => {
            button.dispatchEvent(new window.TouchEvent('touchstart', {bubbles: true}));
            button.dispatchEvent(new window.TouchEvent('touchend', {bubbles: true}));
        });
        await tickAsync(500);
        tick(0);

        assert.equal(instance.clickCount,'1');

        TouchHandlers.shouldUseClickByTap = originalTouchState;
        delete global.navigation;
    });
});
