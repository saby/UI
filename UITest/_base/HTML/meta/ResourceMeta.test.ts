import { assert } from 'chai';
import { getMetaStack, ResourceMeta } from 'UI/_base/HTML/meta';

describe('Env/Disposable', () => {
    describe('ResourceMeta', () => {
        it('проверка метода enter', () => {
            const TITLE_CONTENT = 'ResourceMetaTitle1';
            const resource = new ResourceMeta({title: TITLE_CONTENT});
            resource.enter();
            assert.isTrue(getMetaStack().lastState._meta.title === TITLE_CONTENT,
                'В stack не был добавлен актуальный state');
        });
        it('проверка метода dispose', () => {
            const TITLE_CONTENT = 'ResourceMetaTitle2';
            const resource = new ResourceMeta({title: TITLE_CONTENT});
            resource.enter();
            resource.dispose();
            assert.isFalse(getMetaStack().lastState._meta.title === TITLE_CONTENT,
                'В stack не был удален текущий state');
        });
    });
});
