import * as React from 'react';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { createSandbox } from 'sinon';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import OuterControl from './OuterControl';
import InnerControl from './InnerControl';

describe('хуки жизненного цикла', () => {
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

    it('123', () => {

        // отрисовываем компонент и сразу дожидаемся _afterMount
        let instance;
        act(() => {
            instance = render(<OuterControl/>, container);
        });
        tick(0);
        // endregion

        act(() => {
            instance._forceUpdate();
        });
        tick(0);
        sandbox.assert.match(instance._children.mycontrol instanceof InnerControl, true);
    });
});
