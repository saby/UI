import { assert } from 'chai';
import { generateTagMarkup } from 'UI/_base/_meta/TagMarkup';

const attrs = { attr1: 'val1', attr2: 'val2' };

describe('generateTagMarkup', () => {
   it('tag without attrs', () => {
      assert.strictEqual(
         generateTagMarkup({ tagName: 'title' }),
         '<title data-vdomignore="true"></title>'
      );
   });
   it('void tag without attrs', () => {
      assert.strictEqual(
         generateTagMarkup({ tagName: 'meta' }),
         '<meta data-vdomignore="true">'
      );
   });
   it('tag with attrs', () => {
      assert.strictEqual(
         generateTagMarkup({ tagName: 'link', attrs }),
         '<link data-vdomignore="true" attr1="val1" attr2="val2">'
      );
   });
   it('tag with string child', () => {
      assert.deepEqual(
         generateTagMarkup({ tagName: 'title', children: 'child' }),
         '<title data-vdomignore="true">child</title>'
      );
   });
   it('tag with attrs & string child', () => {
      assert.deepEqual(
         generateTagMarkup({ tagName: 'title', attrs, children: 'child' }),
         '<title data-vdomignore="true" attr1="val1" attr2="val2">child</title>'
      );
   });
});
