import { assert } from 'chai';
import { Head } from 'Application/Page';
import { PrefetchLinksStore, PrefetchLinksStorePS, handlePrefetchModules } from 'UI/_base/HTML/PrefetchLinks';

const module = {
    name: 'Module/File',
    path: '/Module/File.js'
};
describe('UI/_base/HTML/PrefetchLinks', () => {
    typeof window !== 'undefined' &&
    describe('client side', () => {
        beforeEach(() => {
            // @ts-ignore
            Head.getInstance()._elements = {};
        });

        it('addPrefetchModules', () => {
            const pls = new PrefetchLinksStore();
            pls.addPrefetchModules([module.name]);
            // @ts-ignore
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            assert.equal(data[0][0], 'link');
            // @ts-ignore
            assert.equal(data[0][1].rel, 'prefetch');
            // @ts-ignore
            assert.include(data[0][1].href, module.path);
        });

        it('addPreloadModules', () => {
            const pls = new PrefetchLinksStore();
            pls.addPreloadModules([module.name]);
            // @ts-ignore
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            assert.equal(data[0][0], 'link');
            // @ts-ignore
            assert.equal(data[0][1].rel, 'preload');
            // @ts-ignore
            assert.include(data[0][1].href, module.path);
        });
    });

    typeof window === 'undefined' &&
    describe('server side', () => {
        beforeEach(() => {
            // @ts-ignore
            Head.getInstance()._elements = {};
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
            // @ts-ignore
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            assert.equal(data[0][0], 'link');
            // @ts-ignore
            assert.equal(data[0][1].rel, 'prefetch');
            // @ts-ignore
            assert.include(data[0][1].href, module.path);
        });
    });
});
