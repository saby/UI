import Store from "UI/theme/_controller/Store";
import { ICssEntity } from "UI/theme/_controller/css/interface";
import { DEFAULT_THEME, DEFAULT_THEME_TYPE } from "UI/theme/_controller/css/const";
// import { assert } from 'chai';
// import 'mocha';
const name = 'Some/Control';
const theme = 'Some-theme';

class LinkMock implements ICssEntity {
   private requirement = 1;
   outerHtml = '';
   href = '';
   load() {
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
let store: Store;

describe('UI/theme/_controller/Store', () => {

   const setHooks = () => {
      beforeEach(() => {
         link = new LinkMock(name, theme);
         store = new Store();
      });

      afterEach(() => {
         link = null;
         store = null;
      });
   };

   describe('has', () => {
      setHooks();

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
      setHooks();

      it('Добавление новой css', () => {
         store.set(link);
         assert.deepEqual(store.get(name, theme), link);
         assert.sameMembers(store.getCssNames(), [name]);
      });

      it('Добавление новой темы css', () => {
         const theme2 = 'dark-theme';
         const link2 = new LinkMock(name, theme2);
         store.set(link);
         store.set(link2);
         assert.deepEqual(store.get(name, theme), link);
         assert.deepEqual(store.get(name, theme2), link2);
         assert.sameMembers(store.getCssNames(), [name]);
      });
   });

   describe('remove / require', () => {
      setHooks();

      it('Удаление темы', () => {
         store.set(link);
         return store.remove(name, theme).then((isRemoved) => {
            assert.isTrue(isRemoved);
            assert.isFalse(store.has(name, theme));
            assert.sameMembers(store.getCssNames(), [name]);
         });
      });
   });
});
