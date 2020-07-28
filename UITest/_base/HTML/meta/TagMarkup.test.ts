import { assert } from 'chai';
import { generateTagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';

const tagName = 'tag';
const attrs = { attr1: 'val1', attr2: 'val2' };

describe('generateTagMarkup', () => {
   it('tag without attrs', () => {
      assert.strictEqual(
         generateTagMarkup({ tagName }),
         '<tag data-vdomignore="true"/>'
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
         generateTagMarkup({ tagName, attrs }),
         '<tag data-vdomignore="true" attr1="val1" attr2="val2"/>'
      );
   });
   it('tag with string child', () => {
      assert.deepEqual(
         generateTagMarkup({ tagName, children: 'child' }),
         '<tag data-vdomignore="true"> child </tag>'
      );
   });
   it('tag with attrs & string child', () => {
      assert.deepEqual(
         generateTagMarkup({ tagName, attrs, children: 'child' }),
         '<tag data-vdomignore="true" attr1="val1" attr2="val2"> child </tag>'
      );
   });
});
