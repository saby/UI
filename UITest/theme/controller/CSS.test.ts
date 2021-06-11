import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import { THEME_TYPE } from 'UI/theme/controller';
import { createEntity, restoreDeprecatedEntity, restoreEntity } from 'UICommon/theme/_controller/CSS';
import { DEPRECATED_ELEMENT_ATTR, DEPRECATED_THEME_TYPE, ELEMENT_ATTR, EMPTY_THEME } from 'UICommon/theme/_controller/css/const';
import { IHTMLElement } from 'UICommon/theme/_controller/css/interface';
import Link from 'UICommon/theme/_controller/css/Link';
import LinkPS from 'UICommon/theme/_controller/css/LinkPS';
import SingleLink from 'UICommon/theme/_controller/css/SingleLink';
import SingleLinkPS from 'UICommon/theme/_controller/css/SingleLinkPS';

class LinkMock implements IHTMLElement {
   outerHTML: string = '';
   // tslint:disable-next-line:no-empty
   constructor(href: string, name: string, theme: string, themeType: string) {}
   getAttribute(attr: string): string | null {
      return this[attr] || null;
   }
   // tslint:disable-next-line:no-empty
   remove(): void {
   }
}

class LinkElementMock extends LinkMock {
   constructor(
       href: string,
       name: string,
       theme: string,
       themeType: THEME_TYPE) {
      super(href, name, theme, themeType);
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
      super(href, name, theme, themeType);
      this[DEPRECATED_ELEMENT_ATTR.HREF] = href;
      this[DEPRECATED_ELEMENT_ATTR.NAME] = name;
      this[DEPRECATED_ELEMENT_ATTR.THEME] = theme;
      this[DEPRECATED_ELEMENT_ATTR.THEME_TYPE] = themeType;
   }
}

const describeIf = (condition) => condition ? describe : describe.skip;

describe('UICommon/theme/_controller/CSS', () => {
   const href = '#href';
   const cssName = 'cssName';
   const themeName = 'themeName';

   describeIf(constants.isBrowserPlatform)('createEntity на клиенте', () => {
      it('Создает экземпляр Link для мультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.MULTI);
         assert.instanceOf(entity, Link);
      });

      it('Создает экземпляр SingleLink для немультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.SINGLE);
         assert.instanceOf(entity, SingleLink);
      });
   });

   describeIf(constants.isBrowserPlatform)('createEntity на СП', () => {
      it('Создает экземпляр LinkPS для мультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.MULTI);
         assert.instanceOf(entity, LinkPS);
      });

      it('Создает экземпляр SingleLinkPS для немультитемы', () => {
         const entity = createEntity(href, cssName, themeName, THEME_TYPE.SINGLE);
         assert.instanceOf(entity, SingleLinkPS);
      });
   });

   describeIf(constants.isBrowserPlatform)('restoreEntity ', () => {
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

      it('Возвращает SingleLink при отсутствии аттрибута cssName', () => {
         const element = new LinkElementMock(href, cssName, themeName, THEME_TYPE.SINGLE);
         const entity = restoreEntity(element);
         assert.instanceOf(entity, SingleLink);
         assert.equal(entity.cssName, cssName);
      });
   });

   describeIf(constants.isBrowserPlatform)('restorDeprecatedEntity ', () => {
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

      it('Возвращает SingleLink при отсутствии аттрибута cssName', () => {
         const element = new DeprecatedLinkElementMock(href, cssName, themeName, DEPRECATED_THEME_TYPE.SINGLE);
         const entity = restoreDeprecatedEntity(element);
         assert.instanceOf(entity, SingleLink);
         assert.equal(entity.cssName, cssName);
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
