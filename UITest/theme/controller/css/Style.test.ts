import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import Style from 'UI/theme/_controller/css/Style';
import { IHTMLElement } from 'UI/theme/_controller/css/Base';

const name = 'Some/Control';

class ElementMock implements IHTMLElement {
   __removed = false;
   innerHTML = 'test css';
   getAttribute(attr) {
      return this[attr];
   }
   setAttribute(attr, val) {
      this[attr] = val;
   }
   remove() {
      this.__removed = true;
   }
}

describe('UI/theme/_controller/css/Style', () => {

   describe('from', () => {
      if (!constants.isBrowserPlatform) { return; }

      it('Style`s instance from css ', () => {
         const entity = Style.from('css', name);
         assert.instanceOf(entity, Style);
      });
   });

   describe('require / remove', () => {

      it('при удалении экземпляр Style также удаляется элемент из DOM', async () => {
         const element = new ElementMock();
         const style = new Style(name, null, null, element);
         const isRemoved = await style.remove();
         assert.isTrue(isRemoved);
         assert.isTrue(element.__removed);
      });

      it('css, необходимая другим контролам, не удаляется', async () => {
         const element = new ElementMock();
         const style = new Style(name, null, null, element);
         style.require();
         const isRemoved = await style.remove();
         assert.isFalse(isRemoved);
         assert.isFalse(element.__removed);
      });
   });
});
