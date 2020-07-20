// @ts-ignore
import { constants } from 'Env/Env';
import SingleLink from 'UI/theme/_controller/css/SingleLink';
import { THEME_TYPE } from 'UI/theme/controller';
import { IHTMLElement } from 'UI/theme/_controller/css/interface';
import { ELEMENT_ATTR } from 'UI/theme/_controller/css/const';
import { getHtmlMarkup } from 'UI/theme/_controller/css/Base';
import { assert } from 'chai';
// import 'mocha';

const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';
const themeType = THEME_TYPE.MULTI;

class LinkElementMock implements IHTMLElement {
   __removed = false;
   outerHTML = '';
   constructor (
      href: string,
      name: string,
      theme: string,
      themeType: THEME_TYPE) {
      this.outerHTML = getHtmlMarkup(href, name, theme, themeType);

      this[ELEMENT_ATTR.HREF] = href;
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
let link: SingleLink;

describe('UI/theme/_controller/css/SingleLink', () => {

   const setHooks = () => {
      beforeEach(() => {
         element = new LinkElementMock(href, name, theme, themeType);
         link = new SingleLink(href, name, theme, element);
      });
      afterEach(() => {
         link.remove();
         element = null;
         link = null;
      });
   };

   describe('outerHtml', () => {
      setHooks();
      it('outerHtml непустая строка', () => {
         assert.isString(link.outerHtml);
      });

      [href, name, theme, THEME_TYPE.SINGLE].forEach((attr) => {
         it('Разметка содержит ' + attr, () => { assert.include(link.outerHtml, attr, 'Разметка не содержит ' + attr); });
      });
   });

   describe('removeForce', () => {
      setHooks();
      it('при удалении экземпляр SingleLink также удаляется элемент из DOM', () => {
         return link.removeForce().then(() => {
            assert.isFalse(link.isMounted);
            assert.isTrue(element.__removed);
         });
      });

      it('css, необходимая другим контролам, удаляется', () => {
         link.require();
         link.require();
         link.require();
         return link.removeForce().then(() => {
            assert.isFalse(link.isMounted);
            assert.isTrue(element.__removed);
         });
      });
   });
});
