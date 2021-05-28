import * as React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { createSandbox } from 'sinon';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import TestControl2 from './TestControl2';
import TestControl2Inner from './TestControl2Inner';

describe('UIReact/UICore/_base/Control', () => {
    describe('Асинхронный контрол', () => {
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

        beforeEach(() => {
            sandbox = createSandbox();
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            sandbox.restore();
            unmountComponentAtNode(container);
            container.remove();
            container = null;
        });

        it('сначала зовется _afterMount асинхронного ребенка а потом родителя', (done) => {
            const _afterMountOuter = sandbox.stub(
                TestControl2.prototype,
                '_afterMount'
            );
            const _afterMountInner = sandbox.stub(
                TestControl2Inner.prototype,
                '_afterMount'
            );

            act(() => {
                render(<TestControl2 />, container);
            });
            setTimeout(() => {
                try {
                    sandbox.assert.callOrder(
                        _afterMountInner,
                        _afterMountOuter
                    );
                } catch (e) {
                    done(e);
                    return;
                }
                done();
            }, 200);
        });
    });
});
