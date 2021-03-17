// @ts-ignore
import { constants } from 'Env/Env';
import SingleLink from 'UI/theme/_controller/css/SingleLink';
import { THEME_TYPE } from 'UI/theme/controller';
import { IHTMLElement } from 'UI/theme/_controller/css/interface';
import { ELEMENT_ATTR } from 'UI/theme/_controller/css/const';
import { assert } from 'chai';
// import 'mocha';

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

   describe('removeForce', () => {
      setHooks();
      it('при удалении экземпляр SingleLink также удаляется элемент из DOM', () => {
         return link.removeForce().then(() => {
            assert.isFalse(link.isMounted);
         });
      });

      it('css, необходимая другим контролам, удаляется', () => {
         link.require();
         link.require();
         link.require();
         return link.removeForce().then(() => {
            assert.isFalse(link.isMounted);
         });
      });
   });
});
