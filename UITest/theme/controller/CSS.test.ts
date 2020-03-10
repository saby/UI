import { createEntity, restoreEntity } from 'UI/theme/_controller/CSS';
// @ts-ignore
import { constants } from 'Env/Env';
// import { assert } from 'chai';
// import 'mocha';
import SingleLinkPS from 'UI/theme/_controller/css/SingleLinkPS';
import SingleLink from 'UI/theme/_controller/css/SingleLink';
import LinkPS from 'UI/theme/_controller/css/LinkPS';
import Link from 'UI/theme/_controller/css/Link';
import { THEME_TYPE } from 'UI/theme/controller';
import { IHTMLElement } from 'UI/theme/_controller/css/interface';
import { ELEMENT_ATTR } from 'UI/theme/_controller/css/const';

class LinkElementMock implements IHTMLElement {
   __removed = false;
   outerHTML = 'test css';
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
   getAttribute(attr) {
      return this[attr];
   }
   remove() {
      this.__removed = true;
   }
}

describe('UI/theme/_controller/CSS', () => {
   const href = '#href';
   const cssName = 'cssName';
   const themeName = 'themeName';

   describe('createEntity на клиенте', () => {
      if (!constants.isBrowserPlatform) { return; }

      it('Создает экземпляр Link для мультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.MULTI);
         assert.instanceOf(entity, Link);
      });

      it('Создает экземпляр SingleLink для немультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.SINGLE);
         assert.instanceOf(entity, SingleLink);
      });
   });

   describe('createEntity на СП', () => {
      if (!constants.isServerSide) { return; }

      it('Создает экземпляр LinkPS для мультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.MULTI);
         assert.instanceOf(entity, LinkPS);
      });

      it('Создает экземпляр SingleLinkPS для немультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.SINGLE);
         assert.instanceOf(entity, SingleLinkPS);
      });
   });

   describe('restoreEntity ', () => {
      if (!constants.isBrowserPlatform) { return; }

      it('Создает экземпляр Link для мультитемы', () => {
         const element = new LinkElementMock(href, cssName, themeName, THEME_TYPE.MULTI);
         const entity = restoreEntity(element);
         assert.instanceOf(entity, Link);
      });

      it('Создает экземпляр SingleLink для мультитемы', () => {
         const element = new LinkElementMock(href, cssName, themeName, THEME_TYPE.SINGLE);
         const entity = restoreEntity(element);
         assert.instanceOf(entity, SingleLink);
      });

      it('Возврщает null при отсутствии аттрибута', () => {
         const element = new LinkElementMock(href, cssName, null, THEME_TYPE.SINGLE);
         const entity = restoreEntity(element);
         assert.isNull(entity);
      });
   });
});
