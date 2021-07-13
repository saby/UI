import { assert } from 'chai';
import { JML } from 'UI/_base/_meta/interface';
import { fromJML } from 'UI/_base/_meta/JsonML';

const tagName = 'tag';
const attrs = { attr1: 'val1', attr2: 'val2' };
const children: JML = [tagName, attrs];

describe('fromJML', () => {
   it('tag without attrs', () => {
      assert.deepEqual(
         fromJML([tagName]),
         { tagName, attrs: {} }
      );
   });
   it('tag with attrs', () => {
      assert.deepEqual(
         fromJML([tagName, attrs]),
         { tagName, attrs }
      );
   });
   it('tag with attrs & child', () => {
      assert.deepEqual(
         fromJML([tagName, attrs, children]),
         { tagName, attrs, children: { tagName, attrs } }
      );
   });
   it('tag with child', () => {
      assert.deepEqual(
         fromJML([tagName, children]),
         { tagName, attrs: {}, children: { tagName, attrs } }
      );
   });
   it('tag with string child', () => {
      assert.deepEqual(
         fromJML([tagName, 'children']),
         { tagName, attrs: {}, children: 'children' }
      );
   });
});
