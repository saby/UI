import { assert } from 'chai';
import { EntityStorage } from "UICommon/theme/_controller/Storage";
import { ICssEntity } from "UICommon/theme/_controller/css/interface";
import { DEFAULT_THEME, DEFAULT_THEME_TYPE } from "UICommon/theme/_controller/css/const";
const name = 'Some/Control';
const theme = 'Some-theme';

class LinkMock implements ICssEntity {
   private requirement = 1;
   outerHtml = '';
   href = '';
   isMounted = false;
   loading = Promise.resolve();
   load() {
      this.isMounted = true;
      return Promise.resolve();
   }
   element = null;

   constructor(
      public cssName,
      public themeName = DEFAULT_THEME,
      public themeType = DEFAULT_THEME_TYPE
   ) { }

   require() {
      this.requirement++;
      return this;
   }
   remove() {
      this.requirement--;
      return Promise.resolve(this.requirement === 0);
   }
}

let link: LinkMock;
let store: EntityStorage;

describe('UICommon/theme/_controller/Store', () => {
   beforeEach(() => {
      link = new LinkMock(name, theme);
      store = new EntityStorage();
   });

   afterEach(() => {
      link = null;
      store = null;
   });

   describe('has', () => {
      it('Проверка наличия темы для контрола css', () => {
         store.set(link);
         assert.isTrue(store.has(name, theme));
      });

      it('Проверка наличия default темы для контрола css', () => {
         store.set(new LinkMock(name, theme));
         assert.isTrue(store.has(name, theme));
      });
   });

   describe('set / get', () => {
      it('Добавление новой css', () => {
         store.set(link);
         assert.deepEqual(store.get(name, theme), link);
         assert.sameMembers(store.getAllCssNames(), [name]);
      });

      it('Добавление новой темы css', () => {
         const theme2 = 'dark-theme';
         const link2 = new LinkMock(name, theme2);
         store.set(link);
         store.set(link2);
         assert.deepEqual(store.get(name, theme), link);
         assert.deepEqual(store.get(name, theme2), link2);
         assert.sameMembers(store.getAllCssNames(), [name]);
      });
   });

   describe('remove / require', () => {
      it('Удаление темы', () => {
         store.set(link);
         return store.remove(name, theme).then((isRemoved) => {
            assert.isTrue(isRemoved);
            assert.isFalse(store.has(name, theme));
            assert.sameMembers(store.getAllCssNames(), [name]);
         });
      });
   });
});
