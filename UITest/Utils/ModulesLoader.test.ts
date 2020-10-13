import { assert } from 'chai';
import { ModulesLoader } from 'UI/Utils';
import TestModuleSync = require('UITest/Utils/resources/TestModuleSync');

const getModuleUrl = ModulesLoader.getModuleUrl;
const loadAsync = ModulesLoader.loadAsync;
const loadSync = ModulesLoader.loadSync;

describe('UI/_utils/ModulesLoader', () => {
    describe('getModuleUrl()', () => {
        it('should return valid module URL', () => {
            assert.include(getModuleUrl('ControlsUnit/Foo/bar'), '/ControlsUnit/Foo/bar.js');
        });

        it('should return valid library URL', () => {
            assert.include(getModuleUrl('ControlsUnit/Foo:bar'), '/ControlsUnit/Foo.js');
        });
    });

    describe('loadAsync()', () => {
        it('should load module', () => {
            return loadAsync('UITest/Utils/resources/TestLibraryAsync').then((res) => {
                assert.notEqual(res, undefined, 'Module not loaded async');
            });
        });

        it('should load library', () => {
            return loadAsync<Function>('UITest/Utils/resources/TestModuleAsync:exportFunction').then((exportFunction) => {
                assert.notEqual(exportFunction, undefined, 'Module not loaded async');
                assert.equal(exportFunction('test'), 'test', 'Import from module is broken');
            });
        });

        /**
         * Проверяем что повторный вызов тоже работает корректно.
         */
        it('should load library twice', () => {
            return loadAsync<Function>('UITest/Utils/resources/TestModuleAsync:exportFunction').then((exportFunction) => {
                assert.notEqual(exportFunction, undefined, 'Module not loaded async');
                assert.equal(exportFunction('test'), 'test', 'Import from module is broken');
            });
        });

        /**
         * Проверяем что загрузка модуля по другому пути в библиотеке загружает корректный модуль.
         */
        it('should load different modules from same library', () => {
            const one = loadAsync<Function>(
                'UITest/Utils/resources/TestModuleAsyncTwice:exportFunction'
            ).then((exportFunction) => {
                assert.notEqual(exportFunction, undefined, 'Module not loaded async');
                assert.equal(exportFunction('test'), 'test', 'Import from module is broken');
            });
            const two =  loadAsync<Function>(
                'UITest/Utils/resources/TestModuleAsyncTwice:exportFunctionTwice'
            ).then((exportFunction) => {
                assert.notEqual(exportFunction, undefined, 'Module not loaded async');
                assert.equal(exportFunction('test'), 'testtest', 'Import from module is broken');
            });

            return Promise.all([one, two]);
        });

        it('should throw an error of module does not exist', () => {
            return loadAsync('UITest/Utils/resources/TestModuleAsyncFail').catch((err) => {
                assert.include(err.message, typeof window === 'undefined' ? 'Cannot find module' : 'Script error for');
            });
        });

        it('should throw an error if a path within the library is not exists', () => {
            return loadAsync('UITest/Utils/resources/TestModuleAsync:NotFound').then((res) => {
                assert.notEqual(res, null, 'Старое поведение, когда возвращался модуль, если е найдено свойство из библиотеки');
            }, (err) => {
                assert.include(
                    err.message,
                    'Cannot find module "NotFound" in library "UITest/Utils/resources/TestModuleAsync"',
                    'Error message is wrong'
                );
            });
        });
    });

    describe('loadSync()', () => {
        it('should return previously loaded module', () => {
            const syncModule = loadSync('UITest/Utils/resources/TestModuleSync');
            assert.strictEqual(syncModule, TestModuleSync, 'Loaded module is wrong');
        });

        it('should return a module from previously loaded library', () => {
            const syncFunction = loadSync<Function>('UITest/Utils/resources/TestModuleSync:exportSyncFunction');
            assert.equal(syncFunction('test'), 'test', 'Import from module is broken');
        });

        it('should return throw an Error if module does not exist', () => {
            assert.throws(() => {
                loadSync('UITest/Utils/resources/TestModuleSyncFail');
            }, typeof window === 'undefined' ? 'Cannot find module' : 'has not been loaded yet');
        });

        it('should return undefined on second require of not exists module', () => {
            assert.throws(() => {
                loadSync('UITest/Utils/resources/TestModuleSyncFailTwice');
            }, typeof window === 'undefined' ? 'Cannot find module' : 'has not been loaded yet' );

            if (typeof window === 'undefined') {
                assert.isUndefined(loadSync('UITest/Utils/resources/TestModuleSyncFailTwice'));
            }
        });
    });
});
