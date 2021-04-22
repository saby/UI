import { assert } from 'chai';
import { Head } from 'Application/Page';
import { PrefetchLinksStore, PrefetchLinksStorePS, handlePrefetchModules } from 'UI/_deps/PrefetchLinks';
import {JML} from "../../UI/_base/HTML/_meta/interface";

const module = {
    name: 'Module/File',
    path: '/Module/File.js'
};
const expectedObject: Record<string, string|boolean> = {"data-vdomignore": true, as: 'script', href: module.path}
describe('UI/_base/HTML/PrefetchLinks', () => {
    typeof window !== 'undefined' &&
    describe('client side', () => {
        beforeEach(() => {
            Head.getInstance().clear();
        });

        it('addPrefetchModules', () => {
            const pls = new PrefetchLinksStore();
            pls.addPrefetchModules([module.name]);
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            data.forEach((row: JML) => checker.apply(null, row.concat({tag: 'link', rel: 'prefetch', ...expectedObject})));
        });

        it('addPreloadModules', () => {
            const pls = new PrefetchLinksStore();
            pls.addPreloadModules([module.name]);
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            data.forEach((row: JML) => checker.apply(null, row.concat({tag: 'link', rel: 'preload', ...expectedObject})));
        });
    });

    typeof window === 'undefined' &&
    describe('server side', () => {
        beforeEach(() => {
            Head.getInstance().clear();
            new PrefetchLinksStorePS().clear();
        });
        it('addPrefetchModules', () => {
            const pls = new PrefetchLinksStorePS();
            pls.addPrefetchModules([module.name]);
            const modules = pls.getPrefetchModules();
            assert.equal(modules.length, 1);
            assert.equal(modules[0], module.name);
        });

        it('addPreloadModules', () => {
            const pls = new PrefetchLinksStorePS();
            pls.addPreloadModules([module.name]);
            const modules = pls.getPreloadModules();
            assert.equal(modules.length, 1);
            assert.equal(modules[0], module.name);
        });

        it('handlePrefetchModules', () => {
            const pageDeps = ['Module1/File1', 'Module2/File2'];
            const prefetchModules = [module.name, 'Module2/File2'];
            const pls = new PrefetchLinksStorePS();
            pls.addPrefetchModules(prefetchModules);
            handlePrefetchModules(pageDeps);
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            data.forEach((row: JML) => checker.apply(null, row.concat({tag: 'link', rel: 'prefetch', ...expectedObject})));
        });
    });
});

/**
 * Проверка корректности добавленного тега в Head API
 * @param tag название тега
 * @param contents
 * @param attrs атрибуты тега, который добавили в Head
 * @param expected эталонные данные
 */
function checker(tag, contents, attrs, expected) {
    if (contents instanceof Object) {
        expected = attrs;
        attrs = contents;
    }
    assert.equal(tag, expected.tag);
    assert.equal(attrs.rel, expected.rel);
    assert.equal(attrs.as, expected.as);
    assert.include(attrs.href, expected.href);
}
