import * as React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { createSandbox } from 'sinon';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import OuterControl from './OuterControl';
import InnerControl from './InnerControl';

const isBrowser = typeof window !== 'undefined';
const describeIf = (condition) => condition ? describe : describe.skip;

describeIf(isBrowser)('дочерние контролы', () => {
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
        unmountComponentAtNode(container);
        container.remove();
        container = null;
        clock.restore();
        sandbox.restore();
    });

    it('наличие дочернего контрола', () => {
        let instance;
        act(() => {
            instance = render(<OuterControl/>, container);
        });
        tick(0);

        sandbox.assert.match(instance._children.mycontrol instanceof InnerControl, true);
    });
});
