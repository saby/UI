import { createEntity, restoreEntity, restoreDeprecatedEntity } from 'UI/theme/_controller/CSS';
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
import { ELEMENT_ATTR, DEPRECATED_ELEMENT_ATTR, DEPRECATED_THEME_TYPE, EMPTY_THEME } from 'UI/theme/_controller/css/const';

class LinkMock implements IHTMLElement {
   __removed = false;
   outerHTML = 'test css';
   getAttribute(attr) {
      return this[attr] || null;
   }
   remove() {
      this.__removed = true;
   }
}

class LinkElementMock extends LinkMock {
   constructor(
      href: string,
      name: string,
      theme: string,
      themeType: THEME_TYPE) {
      super();
      this[ELEMENT_ATTR.HREF] = href;
      this[ELEMENT_ATTR.NAME] = name;
      this[ELEMENT_ATTR.THEME] = theme;
      this[ELEMENT_ATTR.THEME_TYPE] = themeType;
   }
}

class DeprecatedLinkElementMock extends LinkMock {
   constructor(
      href: string,
      name: string,
      theme: string,
      themeType: DEPRECATED_THEME_TYPE) {
      super();
      this[DEPRECATED_ELEMENT_ATTR.HREF] = href;
      this[DEPRECATED_ELEMENT_ATTR.NAME] = name;
      this[DEPRECATED_ELEMENT_ATTR.THEME] = theme;
      this[DEPRECATED_ELEMENT_ATTR.THEME_TYPE] = themeType;
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

      it('Создает экземпляр Link для deprecacted мультитемы', () => {
         const element = new DeprecatedLinkElementMock(href, cssName, themeName, DEPRECATED_THEME_TYPE.MULTI);
         const entity = restoreEntity(element);
         assert.instanceOf(entity, Link);
      });

      it('Создает экземпляр SingleLink для немультитемы', () => {
         const element = new LinkElementMock(href, cssName, themeName, THEME_TYPE.SINGLE);
         const entity = restoreEntity(element);
         assert.instanceOf(entity, SingleLink);
      });

      it('Создает экземпляр SingleLink для deprecacted немультитемы', () => {
         const element = new DeprecatedLinkElementMock(href, cssName, themeName, DEPRECATED_THEME_TYPE.SINGLE);
         const entity = restoreEntity(element);
         assert.instanceOf(entity, SingleLink);
      });

      it('Возвращает null при отсутствии аттрибута href', () => {
         const element = new LinkElementMock(null, cssName, themeName, THEME_TYPE.SINGLE);
         const entity = restoreEntity(element);
         assert.isNull(entity);
      });

      it('Возвращает null при отсутствии аттрибута cssName', () => {
         const element = new LinkElementMock(href, undefined, themeName, THEME_TYPE.SINGLE);
         const entity = restoreEntity(element);
         assert.isNull(entity);
      });
   });

   describe('restorDeprecatedEntity ', () => {
      if (!constants.isBrowserPlatform) { return; }

      it('Создает экземпляр Link для мультитемы', () => {
         const element = new DeprecatedLinkElementMock(href, cssName, themeName, DEPRECATED_THEME_TYPE.MULTI);
         const entity = restoreDeprecatedEntity(element);
         assert.instanceOf(entity, Link);
      });

      it('Создает экземпляр SingleLink для мультитемы', () => {
         const element = new DeprecatedLinkElementMock(href, cssName, themeName, DEPRECATED_THEME_TYPE.SINGLE);
         const entity = restoreDeprecatedEntity(element);
         assert.instanceOf(entity, SingleLink);
      });

      it('Возвращает null при отсутствии аттрибута href', () => {
         const element = new DeprecatedLinkElementMock(undefined, cssName, themeName, DEPRECATED_THEME_TYPE.SINGLE);
         const entity = restoreDeprecatedEntity(element);
         assert.isNull(entity);
      });

      it('Возвращает null при отсутствии аттрибута cssName', () => {
         const element = new DeprecatedLinkElementMock(href, undefined, themeName, DEPRECATED_THEME_TYPE.SINGLE);
         const entity = restoreDeprecatedEntity(element);
         assert.isNull(entity);
      });

      it('Возвращает SingleLink EMPTY_THEME при отсутствии темы', () => {
         const element = new DeprecatedLinkElementMock(href, cssName, null, DEPRECATED_THEME_TYPE.SINGLE);
         const entity = restoreDeprecatedEntity(element);
         assert.instanceOf(entity, SingleLink);
         assert.equal(entity.themeName, EMPTY_THEME);
      });

      it('Возвращает Link EMPTY_THEME при отсутствии темы', () => {
         const element = new DeprecatedLinkElementMock(href, cssName, null, DEPRECATED_THEME_TYPE.MULTI);
         const entity = restoreDeprecatedEntity(element);
         assert.instanceOf(entity, Link);
         assert.equal(entity.themeName, EMPTY_THEME);
      });
   });
});
