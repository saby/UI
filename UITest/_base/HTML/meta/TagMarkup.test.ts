import { assert } from 'chai';
import { generateTagMarkup, fromJML } from 'UI/_base/HTML/_meta/TagMarkup';
import { JML } from 'UI/_base/HTML/_meta/interface';

const tagName = 'tag';
const attrs = { attr1: 'val1', attr2: 'val2' };
const children: JML = [tagName, attrs];
describe('generateTagMarkup', () => {

   it('tag without attrs', () => {
      assert.strictEqual(generateTagMarkup({ tagName }), '<tag "data-vdomignore"="true">');
   });

   it('tag with attrs', () => {
      const markup = generateTagMarkup({ tagName, attrs });
      assert.strictEqual(markup, '<tag "data-vdomignore"="true" "attr1"="val1" "attr2"="val2">');
   });
});

describe('fromJML', () => {

   it('tag without attrs', () => {
      assert.deepEqual(fromJML([tagName]), { tagName, attrs: {} });
   });

   it('tag with attrs', () => {
      assert.deepEqual(fromJML([tagName, attrs]), { tagName, attrs });
   });

   it('tag with attrs & child', () => {
      assert.deepEqual(fromJML([tagName, attrs, children]), { tagName, attrs, children: { tagName, attrs } });
   });

   it('tag with child', () => {
      assert.deepEqual(fromJML([tagName, children]), { tagName, attrs: {}, children: { tagName, attrs } });
   });
});
