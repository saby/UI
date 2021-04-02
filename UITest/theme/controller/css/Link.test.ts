import { assert } from 'chai';
// import 'mocha';
// @ts-ignore
import { constants } from 'Env/Env';
import Link from 'UICommon/theme/_controller/css/Link';
import { THEME_TYPE } from 'UI/theme/controller';
import { IHTMLElement } from 'UICommon/theme/_controller/css/interface';
import { ELEMENT_ATTR } from 'UICommon/theme/_controller/css/const';
const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';
const themeType = THEME_TYPE.MULTI;

class LinkElementMock implements IHTMLElement {
   constructor(
       href: string,
       name: string,
       theme: string,
       themeType: THEME_TYPE) {
      this[ELEMENT_ATTR.HREF] = href;
      this[ELEMENT_ATTR.NAME] = name;
      this[ELEMENT_ATTR.THEME] = theme;
      this[ELEMENT_ATTR.THEME_TYPE] = themeType;
   }
   getAttribute(attr: string): string {
      return this[attr];
   }
   // tslint:disable-next-line:no-empty
   remove(): void {}
}

let element: LinkElementMock;
let link: Link;

describe('UICommon/theme/_controller/css/Link', () => {

   const setHooks = () => {
      beforeEach(() => {
         element = new LinkElementMock(href, name, theme, themeType);
         link = new Link(href, name, theme, element);
      });
      afterEach(() => {
         link.remove();
         element = null;
         link = null;
      });
   };

   describe('load', () => {
      if (!constants.isBrowserPlatform) { return; }
      setHooks();

      it('load returns Promise<void>', () => {
         const link = new Link(href, name, theme);
         assert.instanceOf(link.load(), Promise);
         link.remove();
      });

      it('isMounted true after load', () => {
         const link = new Link(href, name, theme);
         return link.load()
             .then(() => { assert.isTrue(link.isMounted); })
             .then(() => link.remove());
      });
   });

   describe('from', () => {
      setHooks();
      it('Link`s instance from HTMLLinkElement', () => {
         assert.instanceOf(link, Link);
         assert.strictEqual(name, link.cssName);
         assert.strictEqual(theme, link.themeName);
      });
   });

   describe('require / remove', () => {
      setHooks();
      it('при удалении экземпляр Link также удаляется элемент из DOM', () => {
         return link.remove().then((isRemoved) => {
            assert.isFalse(link.isMounted);
            assert.isTrue(isRemoved);
         });
      });

      it('css, необходимая другим контролам, не удаляется', () => {
         link.require();
         return link.remove().then((isRemoved) => {
            assert.isFalse(isRemoved);
         });
      });
   });
});
