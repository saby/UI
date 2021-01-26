import { assert } from 'chai';
import { ResourceMeta } from 'UI/_base/HTML/meta';

describe('Env/Disposable', () => {
    describe('ResourceMeta', () => {
        it('проверка метода enter', () => {
            const TITLE_CONTENT = 'ResourceMetaTitle1';
            const resource = new ResourceMeta({title: TITLE_CONTENT});
            resource.enter();
            assert.isTrue(document.title === TITLE_CONTENT, 'title не был изменен');
        });
        it('проверка метода dispose', () => {
            const PREV_CONTENT = document.title;
            const TITLE_CONTENT = 'ResourceMetaTitle2';
            const resource = new ResourceMeta({title: TITLE_CONTENT});
            resource.enter();
            assert.isTrue(document.title === TITLE_CONTENT, 'title не был изменен');
            resource.dispose();
            assert.isTrue(document.title === PREV_CONTENT, 'title не был удалён');
        });
    });
});
