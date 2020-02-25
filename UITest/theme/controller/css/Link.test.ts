import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import Link from 'UI/theme/_controller/css/Link';
import { THEME_TYPE } from 'UI/theme/controller';
import { ELEMENT_ATTR, IHTMLElement } from 'UI/theme/_controller/css/Base';

const href = 'Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';
const themeType = THEME_TYPE.MULTI;

class LinkElementMock implements IHTMLElement {
   __removed = false;
   outerHTML = 'test css';
   constructor(
      _href: string,
      name: string,
      theme: string,
      themeType: THEME_TYPE) { 
         this[ELEMENT_ATTR.NAME] = name;
         this[ELEMENT_ATTR.THEME] = theme;
         this[ELEMENT_ATTR.THEME_TYPE] = themeType;
      }
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
         assert.strictEqual(name, link.cssName);
         assert.strictEqual(theme, link.themeName);
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
