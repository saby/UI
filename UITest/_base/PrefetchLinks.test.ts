import { assert } from 'chai';
import { Head } from 'Application/Page';
import { default as PrefetchLinksStore, handlePrefetchModules } from 'UI/_base/HTML/PrefetchLinks';

const module = {
    name: 'Module/File',
    path: '/Module/File.js'
};
const pls = new PrefetchLinksStore();
describe('UI/_base/HTML/PrefetchLinks', () => {
    typeof window !== 'undefined' && describe('client side', () => {
        beforeEach(() => {
            Head.getInstance()._elements = {};
        });

        it('addPrefetchModules', () => {
            pls.addPrefetchModules([module.name]);
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            assert.equal(data[0][0], 'link');
            assert.equal(data[0][1].rel, 'prefetch');
            assert.include(data[0][1].href, module.path);
        });

        it('addPreloadModules', () => {
            pls.addPreloadModules([module.name]);
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            assert.equal(data[0][0], 'link');
            assert.equal(data[0][1].rel, 'preload');
            assert.include(data[0][1].href, module.path);
        });
    });

    typeof window === 'undefined' && describe('server side', () => {
        it('addPrefetchModules', () => {
            pls.addPrefetchModules([module.name]);
            const modules = pls.getPrefetchModules();
            assert.equal(modules.length, 1);
            assert.equal(modules[0], module.name);
        });

        it('addPreloadModules', () => {
            pls.addPreloadModules([module.name]);
            const modules = pls.getPreloadModules();
            assert.equal(modules.length, 1);
            assert.equal(modules[0], module.name);
        });

        it('handlePrefetchModules', () => {
            const pageDeps = ['Module1/File1', 'Module2/File2'];
            const prefetchModules = [module.name, 'Module2/File2'];
            pls.addPrefetchModules(prefetchModules);
            handlePrefetchModules(pageDeps);
            const data = Head.getInstance().getData();
            assert.equal(data.length, 1);
            assert.equal(data[0][0], 'link');
            assert.equal(data[0][1].rel, 'prefetch');
            assert.include(data[0][1].href, module.path);
        });
    });
});
