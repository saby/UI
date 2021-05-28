import { assert } from 'chai';
import { createSandbox, stub } from 'sinon';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';

import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import { IoC, constants } from 'Env/Env';
import { default as Async }  from 'ReactUnitTest/_async/Async';

// предзагрузим модули, на которых будем тестировать Async - в тестах главное протестировать факт вызова require
import TestControlSync = require('ReactUnitTest/_async/TestControlSync');
import TestControlAsync = require('ReactUnitTest/_async/TestControlAsync');
import TestLibraryAsync = require('ReactUnitTest/_async/TestLibraryAsync');


describe('UICore/Async:Async', () => {

    function getErrorText(moduleName: string): string {
        return `Ошибка загрузки контрола "${moduleName}"\n`
            + 'Возможны следующие причины:\n\t                   • '
            + 'Ошибка в самом контроле\n\t                   • '
            + 'Долго отвечал БЛ метод в _beforeUpdate\n\t                   • '
            + 'Контрола не существует';
    }

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

    const warns = [];
    const originalLogger = IoC.resolve('ILogger');
    let container: HTMLDivElement;
    let sandbox;
    let clock;

    before(() => {
        const browser = new JSDOM();
        global.window = browser.window;
        global.document = window.document;
        // global.MessageChannel = require('worker_threads').MessageChannel;
    });

    after(() => {
        delete global.window;
        delete global.document;
        // delete global.MessageChannel;
    });

    beforeEach(() => {
        // переопределяем логгер, чтобы при ошибках загрузки не упали тесты из-за сообщений логгера
        IoC.bind('ILogger', {
            warn: (message) => {
                warns.push(message);
            },
            error: originalLogger.error,
            log: originalLogger.log,
            info: originalLogger.info
        });

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
        IoC.bind('ILogger', originalLogger);

        clock.restore();
        sandbox.restore();

        container.remove();
        container = null;
    });

    // тесты поведения на сервере
    if (typeof window === 'undefined') {
        it('Синхронная загрузка контрола на сервере', () => {
            const moduleName = 'ReactUnitTest/_async/TestControlSync';

            let instance;
            act(() => {
                instance = render(
                    <Async templateName={moduleName} templateOptions="{}"/>,
                    container
                );
            });

            assert.isNotOk(instance.getError(), 'Поле с ошибкой должно быть пустым.');
            assert.equal(instance.getCurrentTemplateName(), moduleName);
            assert.equal(instance.getOptionsForComponent().resolvedTemplate, TestControlSync);
        });

        it('Синхронная загрузка контрола на сервере, с ошибкой', () => {
            const moduleName = 'ReactUnitTest/_async/Fail/TestControlSync';

            let instance;
            act(() => {
                instance = render(
                    <Async templateName={moduleName} templateOptions="{}"/>,
                    container
                );
            });

            assert.equal(instance.getError(), getErrorText(moduleName));
            assert.strictEqual(instance.getOptionsForComponent().resolvedTemplate, undefined);
        });
    }

    describe('Проверка работы Async в браузере', () => {
        let isBrowserPlatformStub;
        let compatStub;

        before(() => {
            isBrowserPlatformStub = stub(constants, 'isBrowserPlatform').value(true);
            compatStub = stub(constants, 'compat').value(false);
        });

        after(() => {
            isBrowserPlatformStub.restore();
            compatStub.restore();
        });

        it('Синхронная загрузка контрола', () => {
            const moduleName = 'ReactUnitTest/_async/TestControlSync';
            const notifyStub = sandbox.stub(Async.prototype, '_notify');

            let instance;
            act(() => {
                instance = render(
                    <Async templateName={moduleName} templateOptions="{}"/>,
                    container
                );
            });

            assert.isNotOk(instance.getError(), 'Поле с ошибкой должно быть пустым.');
            assert.equal(instance.getCurrentTemplateName(), moduleName);
            assert.strictEqual(instance.getOptionsForComponent().resolvedTemplate, TestControlSync);
            sandbox.assert.called(notifyStub);  // Ожидалось, что будет вызван метод публикации события "_notify"
            assert.includeMembers(notifyStub.getCall(0).args, ['load'], 'Не было опубликовано событие "load"');
        });

        it('Синхронная загрузка контрола, с ошибкой', () => {
            const moduleName = 'ReactUnitTest/_async/Fail/TestControlSync';

            // заглушка для проверки факта вызова загрузки в "require"
            const loadSyncStub = sandbox.stub(ModulesLoader, 'loadSync')
                .withArgs(moduleName).returns(null);
            // заглушка для ModulesLoader.isLoaded, чтобы проверить синхронную загрузку контрола
            const isLoadedStub = sandbox.stub(ModulesLoader, 'isLoaded');
            isLoadedStub.withArgs(moduleName).returns(true);

            let instance;
            act(() => {
                instance = render(
                    <Async templateName={moduleName} templateOptions="{}"/>,
                    container
                );
            });
            // удалим заглушку функции ModulesLoader.isLoaded
            isLoadedStub.restore();

            // проверим, что была попытка синхронной загрузки контрола
            sandbox.assert.called(loadSyncStub);
            assert.equal(instance.getError(), getErrorText(moduleName));
            assert.strictEqual(instance.getOptionsForComponent().resolvedTemplate, undefined);
        });

        it('Асинхронная загрузка контрола', (done) => {
            const moduleName = 'ReactUnitTest/_async/TestControlAsync';
            // заглушка для проверки события загрузки контрола
            const notifyStub = sandbox.stub(Async.prototype, '_notify');
            // заглушка для проверки факта вызова загрузки в "require"
            const loadAsyncStub = sandbox.stub(ModulesLoader, 'loadAsync')
                .withArgs(moduleName).resolves(TestControlAsync);
            // заглушка для ModulesLoader.isLoaded, чтобы проверить асинхронную загрузку контрола
            const isLoadedStub = sandbox.stub(ModulesLoader, 'isLoaded');
            isLoadedStub.withArgs(moduleName).returns(false);

            let instance;
            act(() => {
                instance = render(
                    <Async templateName={moduleName} templateOptions="{}"/>,
                    container
                );
            });
            // удалим заглушку функции ModulesLoader.isLoaded
            isLoadedStub.restore();

            tick(0);  // вызов _afterMount

            // проверим, что был вызов асинхронной загрузки контрола
            sandbox.assert.called(loadAsyncStub);

            // вызов _beforeUpdate
            tickAsync(0).then(() => {
                tick(0);  // вызов _afterUpdate, чтобы опубликовалось событие 'load'

                assert.isNotOk(instance.getError(), 'Поле с ошибкой должно быть пустым.');
                assert.equal(instance.getCurrentTemplateName(), moduleName);
                assert.strictEqual(instance.getOptionsForComponent().resolvedTemplate, TestControlAsync);
                sandbox.assert.called(notifyStub);  // Ожидалось, что будет вызван метод публикации события "_notify"
                assert.includeMembers(notifyStub.getCall(0).args, ['load'], 'Не было опубликовано событие "load"');
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it('Асинхронная загрузка контрола, с ошибкой', (done) => {
            const moduleName = 'ReactUnitTest/_async/Fail/TestControlAsync';
            // заглушка для проверки события загрузки контрола
            const notifyStub = sandbox.stub(Async.prototype, '_notify');
            // заглушка для проверки факта вызова загрузки в "require"
            const loadAsyncStub = sandbox.stub(ModulesLoader, 'loadAsync').withArgs(moduleName).rejects();

            let instance;
            act(() => {
                instance = render(
                    <Async templateName={moduleName} templateOptions="{}"/>,
                    container
                );
            });

            tick(0);  // вызов _afterMount

            // проверим, что был вызов асинхронной загрузки контрола
            sandbox.assert.called(loadAsyncStub);

            // вызов _beforeUpdate
            tickAsync(0).then(() => {
                tick(0);  // вызов _afterUpdate

                assert.equal(instance.getError(), getErrorText(moduleName));
                assert.strictEqual(instance.getOptionsForComponent().resolvedTemplate, undefined);
                sandbox.assert.notCalled(notifyStub);  // не должно быть вызова метода публикации события "_notify"
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it('Асинхронная загрузка из библиотеки', (done) => {
            const moduleName = 'ReactUnitTest/_async/TestLibraryAsync:ExportControl';
            // заглушка для проверки факта вызова загрузки в "require"
            sandbox.stub(ModulesLoader, 'loadAsync').withArgs(moduleName).resolves(TestLibraryAsync.ExportControl);
            // заглушка для ModulesLoader.isLoaded, чтобы проверить асинхронную загрузку контрола
            const isLoadedStub = sandbox.stub(ModulesLoader, 'isLoaded');
            isLoadedStub.withArgs(moduleName).returns(false);

            let instance;
            act(() => {
                instance = render(
                    <Async templateName={moduleName} templateOptions="{}"/>,
                    container
                );
            });
            // удалим заглушку функции ModulesLoader.isLoaded
            isLoadedStub.restore();

            tick(0);  // вызов _afterMount

            // вызов _beforeUpdate
            tickAsync(0).then(() => {
                tick(0);  // вызов _afterUpdate

                assert.isNotOk(instance.getError(), 'Поле с ошибкой должно быть пустым.');
                assert.equal(instance.getCurrentTemplateName(), moduleName);
                assert.strictEqual(instance.getOptionsForComponent().resolvedTemplate, TestLibraryAsync.ExportControl);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });
});
