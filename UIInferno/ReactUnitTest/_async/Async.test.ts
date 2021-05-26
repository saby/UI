import { assert } from 'chai';
import { createSandbox, stub } from 'sinon';

import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import { IoC, constants } from 'Env/Env';
import { IAsyncOptions } from 'UICore/Async';
import { default as Async }  from 'ReactUnitTest/_async/Async';

// предзагрузим модули, на которых будем тестировать Async - в тестах главное протестировать факт вызова require
import TestControlSync = require('ReactUnitTest/_async/TestControlSync');
import TestControlAsync = require('ReactUnitTest/_async/TestControlAsync');
import TestLibraryAsync = require('ReactUnitTest/_async/TestLibraryAsync');


describe('UICore/Async:Async', () => {
    function getOptions(templateName: string): IAsyncOptions {
        return {
            templateName,
            templateOptions: {}
        };
    }

    function getErrorText(moduleName: string): string {
        return `Ошибка загрузки контрола "${moduleName}"\n`
            + 'Возможны следующие причины:\n\t                   • '
            + 'Ошибка в самом контроле\n\t                   • '
            + 'Долго отвечал БЛ метод в _beforeUpdate\n\t                   • '
            + 'Контрола не существует';
    }

    const warns = [];
    const originalLogger = IoC.resolve('ILogger');

    before(() => {
        // переопределяем логгер, чтобы при ошибках загрузки не упали тесты из-за сообщений логгера
        IoC.bind('ILogger', {
            warn: (message) => {
                warns.push(message);
            },
            error: originalLogger.error,
            log: originalLogger.log,
            info: originalLogger.info
        });
    });
    after(() => {
        IoC.bind('ILogger', originalLogger);
    });

    // тесты поведения на сервере
    if (typeof window === 'undefined') {
        it('Синхронная загрузка контрола на сервере', () => {
            const moduleName = 'ReactUnitTest/_async/TestControlSync';
            const options = getOptions(moduleName);

            const async = new Async(options);
            async._beforeMount(options);

            assert.isNotOk(async.getError(), 'Поле с ошибкой должно быть пустым.');
            assert.equal(async.getCurrentTemplateName(), moduleName);
            assert.equal(async.getOptionsForComponent().resolvedTemplate, TestControlSync);
        });

        it('Синхронная загрузка контрола на сервере, с ошибкой', () => {
            const moduleName = 'ReactUnitTest/_async/Fail/TestControlSync';
            const options = getOptions(moduleName);
            const async = new Async(options);
            return async._beforeMount(options);

            assert.equal(async.getError(), getErrorText(moduleName));
            assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, undefined);
        });
    }

    describe('Проверка работы Async в браузере', () => {
        let isBrowserPlatformStub;
        let compatStub;
        let sandbox;
        const BUILDED_ON_SERVER = true;

        before(() => {
            isBrowserPlatformStub = stub(constants, 'isBrowserPlatform').value(true);
            compatStub = stub(constants, 'compat').value(false);
        });

        after(() => {
            isBrowserPlatformStub.restore();
            compatStub.restore();
        });

        beforeEach(() => {
            sandbox = createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('Синхронная загрузка контрола', () => {
            const moduleName = 'ReactUnitTest/_async/TestControlSync';
            const options = getOptions(moduleName);
            // заглушка для проверки события загрузки контрола
            const notifyStub = sandbox.stub(Async.prototype, '_notify');

            const async = new Async(options);
            // @ts-ignore Хак: Почему-то нет опций после конструктора
            async._options = options;
            async._beforeMount(options, undefined, BUILDED_ON_SERVER);
            async._componentDidMount();

            assert.isNotOk(async.getError(), 'Поле с ошибкой должно быть пустым.');
            assert.equal(async.getCurrentTemplateName(), moduleName);
            assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, TestControlSync);
            sandbox.assert.called(notifyStub);  // Ожидалось, что будет вызван метод публикации события "_notify"
            assert.includeMembers(notifyStub.getCall(0).args, ['load'], 'Не было опубликовано событие "load"');
        });

        it('Синхронная загрузка контрола, с ошибкой', () => {
            const moduleName = 'ReactUnitTest/_async/Fail/TestControlSync';
            const options = getOptions(moduleName);
            // заглушка для проверки факта вызова загрузки в "require"
            const loadSyncStub = sandbox.stub(ModulesLoader, 'loadSync').withArgs(moduleName).returns(null);
            // заглушка для ModulesLoader.isLoaded, чтобы проверить синхронную загрузку контрола
            const isLoadedStub = sandbox.stub(ModulesLoader, 'isLoaded');
            isLoadedStub.withArgs(moduleName).returns(true);

            const async = new Async(options);
            async._beforeMount(options, undefined, BUILDED_ON_SERVER);

            // проверим, что была попытка синхронной загрузки контрола
            assert(loadSyncStub.called, 'Требуемый контрол не грузился синхронно.');
            assert.equal(async.getError(), getErrorText(moduleName));
            assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, undefined);
        });

        it('Асинхронная загрузка контрола', () => {
            const moduleName = 'ReactUnitTest/_async/TestControlAsync';
            const options = getOptions(moduleName);
            // заглушка для проверки события загрузки контрола
            const notifyStub = sandbox.stub(Async.prototype, '_notify');
            // заглушка для проверки факта вызова загрузки в "require"
            const loadAsyncStub = sandbox.stub(ModulesLoader, 'loadAsync')
                .withArgs(moduleName).resolves(TestControlAsync);
            // заглушка для ModulesLoader.isLoaded, чтобы проверить асинхронную загрузку контрола
            const isLoadedStub = sandbox.stub(ModulesLoader, 'isLoaded');
            isLoadedStub.withArgs(moduleName).returns(false);

            const async = new Async(options);
            // @ts-ignore Хак: Почему-то нет опций после конструктора
            async._options = options;
            return async._beforeMount(options, undefined, BUILDED_ON_SERVER).then(() => {
                // удалим заглушку функции ModulesLoader.isLoaded
                isLoadedStub.restore();

                // проверим, что был вызов асинхронной загрузки контрола
                sandbox.assert.called(loadAsyncStub);

                async._componentDidMount();
                async._beforeUpdate(options);
                async._afterUpdate();

                assert.isNotOk(async.getError(), 'Поле с ошибкой должно быть пустым.');
                assert.equal(async.getCurrentTemplateName(), moduleName);
                assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, TestControlAsync);
                sandbox.assert.called(notifyStub);  // Ожидалось, что будет вызван метод публикации события "_notify"
                assert.includeMembers(notifyStub.getCall(0).args, ['load'], 'Не было опубликовано событие "load"');
            });
        });

        it('Асинхронная загрузка контрола, с ошибкой', () => {
            const moduleName = 'ReactUnitTest/_async/Fail/TestControlAsync';
            const options = getOptions(moduleName);
            // заглушка для проверки события загрузки контрола
            const notifyStub = sandbox.stub(Async.prototype, '_notify');
            // заглушка для проверки факта вызова загрузки в "require"
            const loadAsyncStub = sandbox.stub(ModulesLoader, 'loadAsync').withArgs(moduleName).rejects();


            const async = new Async(options);
            return async._beforeMount(options, undefined, BUILDED_ON_SERVER).then(() => {
                // проверим, что был вызов асинхронной загрузки контрола
                sandbox.assert.called(loadAsyncStub);

                async._componentDidMount();
                async._beforeUpdate(options);
                async._afterUpdate();

                assert.equal(async.getError(), getErrorText(moduleName));
                assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, undefined);
                sandbox.assert.notCalled(notifyStub);  // не должно быть вызова метода публикации события "_notify"
            });
        });

        it('Асинхронная загрузка из библиотеки', () => {
            const moduleName = 'ReactUnitTest/_async/TestLibraryAsync:ExportControl';
            const options = getOptions(moduleName);
            // заглушка для проверки факта вызова загрузки в "require"
            sandbox.stub(ModulesLoader, 'loadAsync').withArgs(moduleName).resolves(TestLibraryAsync.ExportControl);
            // заглушка для ModulesLoader.isLoaded, чтобы проверить асинхронную загрузку контрола
            const isLoadedStub = sandbox.stub(ModulesLoader, 'isLoaded');
            isLoadedStub.withArgs(moduleName).returns(false);

            const async = new Async(options);
            // @ts-ignore Хак: Почему-то нет опций после конструктора
            async._options = options;
            return async._beforeMount(options, undefined, BUILDED_ON_SERVER).then(() => {
                // удалим заглушку функции ModulesLoader.isLoaded
                isLoadedStub.restore();

                async._componentDidMount();
                async._beforeUpdate(options);
                async._afterUpdate();

                assert.isNotOk(async.getError(), 'Поле с ошибкой должно быть пустым.');
                assert.equal(async.getCurrentTemplateName(), moduleName);
                assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, TestLibraryAsync.ExportControl);
            });
        });
    });
});
