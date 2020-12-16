import { assert } from 'chai';
import { IoC, constants } from 'Env/Env';
import { IAsyncOptions } from 'UI/Base';
import { default as Async }  from 'UITest/_async/Async';
import TestControlSync = require('UITest/_async/TestControlSync');

function getOptions(templateName: string): IAsyncOptions {
    return {
        templateName,
        templateOptions: {}
    };
}

describe('UI/Base:Async', () => {
    // переопределяем логгер, чтобы при ошибках загрузки не упали тесты из-за сообщений логгера
    const warns = [];
    const originalLogger = IoC.resolve('ILogger');

    beforeEach(() => {
        IoC.bind('ILogger', {
            warn: (message) => {
                warns.push(message);
            },
            error: originalLogger.error,
            log: originalLogger.log,
            info: originalLogger.info
        });
    });
    afterEach(() => {
        IoC.bind('ILogger', originalLogger);
    });

    if (typeof window === 'undefined') {
        it('Loading synchronous server-side', () => {
            const options = getOptions('UITest/_async/TestControlSync');
            const oldCompat = constants.compat;
            constants.compat = false;

            const async = new Async(options);
            async._beforeMount(options);

            assert.isNotOk(async.getError(), 'error state should be empty');
            assert.equal(async.getCurrentTemplateName(), 'UITest/_async/TestControlSync');
            assert.equal(async.getOptionsForComponent().resolvedTemplate, TestControlSync);
            constants.compat = oldCompat;
        });

        it('Loading synchronous server-side failed', () => {
            const options = getOptions('UITest/_async/Fail/TestControlSync');
            const ERROR_TEXT = 'Ошибка загрузки контрола "UITest/_async/Fail/TestControlSync"'
                + '\nВозможны следующие причины:\n\t                   • '
                + 'Ошибка в самом контроле\n\t                   • '
                + 'Долго отвечал БЛ метод в _beforeUpdate\n\t                   • '
                + 'Контрола не существует';

            const async = new Async(options);
            return async._beforeMount(options).then(() => {
                async._beforeUpdate(options);

                assert.equal(async.getError(), ERROR_TEXT);
                assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, undefined);
            });
        }).timeout(4000);
    }

    it('Loading synchronous client-side', () => {
        const options = getOptions('UITest/_async/TestControlSync');
        const oldCompat = constants.compat;
        constants.compat = false;

        const async = new Async(options);
        const BUILDED_ON_SERVER = true;
        async._beforeMount(options, undefined, BUILDED_ON_SERVER);
        async._beforeUpdate(options);

        assert.isNotOk(async.getError(), 'error state should be empty');
        assert.equal(async.getCurrentTemplateName(), 'UITest/_async/TestControlSync');
        assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, TestControlSync);
        constants.compat = oldCompat;
    });

    it('Loading synchronous client-side failed', () => {
        const options = getOptions('UITest/_async/Fail/TestControlSync');
        const ERROR_TEXT = 'Ошибка загрузки контрола "UITest/_async/Fail/TestControlSync"\n'
            + 'Возможны следующие причины:\n\t                   • '
            + 'Ошибка в самом контроле\n\t                   • '
            + 'Долго отвечал БЛ метод в _beforeUpdate\n\t                   • '
            + 'Контрола не существует';

        const async = new Async(options);
        return async._beforeMount(options).then(() => {
            async._beforeUpdate(options);

            assert.equal(async.getError(), ERROR_TEXT);
            assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, undefined);
        });
    }).timeout(4000);

    it('Loading asynchronous client-side', () => {
        const options = getOptions('UITest/_async/TestControlAsync');
        const async = new Async(options);
        // @ts-ignore Хак: Почему-то нет опций после конструктора
        async._options = options;
        return async._beforeMount(options).then(() => {
            async._beforeUpdate(options);
            async._afterUpdate();

            assert.isNotOk(async.getError(), 'Error message should be empty');
            assert.strictEqual(async.getOptionsForComponent().resolvedTemplate,
                require('UITest/_async/TestControlAsync'));
        });
    }).timeout(3000);

    it('Loading asynchronous from library client-side', () => {
        const options = getOptions('UITest/_async/TestLibraryAsync:ExportControl');
        const async = new Async(options);
        // @ts-ignore Хак: Почему-то нет опций после конструктора
        async._options = options;
        return async._beforeMount(options).then(() => {
            async._beforeUpdate(options);
            async._afterUpdate();

            assert.isNotOk(async.getError(), 'Error message should be empty');
            assert.strictEqual(async.getOptionsForComponent().resolvedTemplate,
                require('UITest/_async/TestLibraryAsync').ExportControl);
        });
    }).timeout(3000);

    it('Loading asynchronous client-side failed', () => {
        const options = getOptions('UITest/_async/Fail/TestControlAsync');
        const ERROR_TEXT = 'Ошибка загрузки контрола "UITest/_async/Fail/TestControlAsync"\n'
            + 'Возможны следующие причины:\n\t                   • '
            + 'Ошибка в самом контроле\n\t                   • '
            + 'Долго отвечал БЛ метод в _beforeUpdate\n\t                   • '
            + 'Контрола не существует';

        const async = new Async(options);
        async._beforeMount(options);
        async._beforeUpdate(options);
        async._afterUpdate();

        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        }).then(() => {
            assert.equal(async.getError(), ERROR_TEXT);
            assert.strictEqual(async.getOptionsForComponent().resolvedTemplate, undefined);
        });
    }).timeout(4000);
});