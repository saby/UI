import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import 'mocha';
import Link, { IHTMLLinkElement } from 'UI/theme/_controller/css/Link';
import { THEME_TYPE } from 'UI/theme/controller';

const href = 'Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';
const themeType = THEME_TYPE.MULTI;

class LinkElementMock implements IHTMLLinkElement {
   __removed = false;
   innerHTML = 'test css';
   constructor(
      public href: string,
      public name: string,
      public theme: string,
      public themeType: THEME_TYPE) { }
   getAttribute(attr) {
      return this[attr];
   }
   remove() {
      this.__removed = true;
   }
}

let element: LinkElementMock;
let link: Link;

describe('UI/theme/_controller/css/Link', () => {

   beforeEach(() => {
      element = new LinkElementMock(href, name, theme, themeType);
      link = Link.from(element);
   });

   describe('from', () => {
      it('Link`s instance from HTMLLinkElement', () => {
         assert.instanceOf(link, Link);
         assert.strictEqual(name, link.name);
         assert.strictEqual(theme, link.theme);
         assert.strictEqual(themeType, link.themeType);
      });
   });

   describe('require / remove', () => {
      if (!constants.isBrowserPlatform) { return; }

      it('при удалении экземпляр Link также удаляется элемент из DOM', async () => {
         const isRemoved = await link.remove();
         assert.isTrue(isRemoved);
         assert.isTrue(element.__removed);
      });

      it('css, необходимая другим контролам, не удаляется', async () => {
         link.require();
         const isRemoved = await link.remove();
         assert.isFalse(isRemoved);
         assert.isFalse(element.__removed);
      });
   });
});
