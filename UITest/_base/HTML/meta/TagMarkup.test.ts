import { assert } from 'chai';
import { generateTagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';

describe('generateTagMarkup', () => {

   it('tag without attrs', () => {
      assert.strictEqual(generateTagMarkup({ tagName: 'tag' }), '<tag "data-vdomignore"="true">');
   });

   it('tag with attrs', () => {
      const markup = generateTagMarkup({ tagName: 'tag', attrs: { attr1: 'val1', attr2: 'val2' } });
      assert.strictEqual(markup, '<tag "data-vdomignore"="true" "attr1"="val1" "attr2"="val2">');
   });
});
