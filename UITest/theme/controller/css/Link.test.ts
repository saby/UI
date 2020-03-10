// @ts-ignore
import { constants } from 'Env/Env';
import Link from 'UI/theme/_controller/css/Link';
import { THEME_TYPE } from 'UI/theme/controller';
import { IHTMLElement, ILoader } from 'UI/theme/_controller/css/interface';
import { ELEMENT_ATTR } from 'UI/theme/_controller/css/const';
// import { assert } from 'chai';
// import 'mocha';
const href = '#Some/href';
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
let loader: LoaderMock;
let link: Link;
class LoaderMock implements ILoader {
   loads: object = {};
   load(href: string): Promise<void> {
      this.loads[href] = this.loads[href] ? this.loads[href] + 1 : 1;
      return Promise.resolve(void 0);
   }
};

describe('UI/theme/_controller/css/Link', () => {

   const setHooks = () => {
      beforeEach(() => {
         element = new LinkElementMock(href, name, theme, themeType);
         link = new Link(href, name, theme, element);
         loader = new LoaderMock();
      });
      afterEach(() => {
         link.remove();
         element = null;
         link = null;
         loader = null;
      });
   };

   describe('load', () => {
      if (!constants.isBrowserPlatform) { return; }
      setHooks();

      it('load returns Promise<void>', () => {
         const link = new Link(href, name, theme);
         assert.instanceOf(link.load(loader), Promise);
         link.remove();
      });

      it('load fetch css by href', () => {
         const link = new Link(href, name, theme);
         return link.load(loader)
            .then(() => { assert.isTrue(href in loader.loads); })
            .then(() => link.remove());
      });
   });

   describe('outerHtml', () => {
      setHooks();
      it('outerHtml непустая строка', () => {
         assert.isString(link.outerHtml);
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
            assert.isTrue(isRemoved);
            assert.isTrue(element.__removed);
         });
      });

      it('css, необходимая другим контролам, не удаляется', () => {
         link.require();
         return link.remove().then((isRemoved) => {
            assert.isFalse(isRemoved);
            assert.isFalse(element.__removed);
         });
      });
   });
});
