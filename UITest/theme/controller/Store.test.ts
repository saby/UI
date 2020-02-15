import Store from "UI/theme/_controller/Store";
import CssLink, { THEME_TYPE, ICssLink } from "UI/theme/_controller/CssLink";
import { assert } from 'chai';
import 'mocha';

const name = 'Some/Control';
const theme = 'Some-theme';

class LinkMock implements ICssLink {
   private requirement = 1;
   css = '';
   element = null;

   constructor(
      public name,
      public theme = CssLink.DEFAULT_THEME,
      public themeType = CssLink.DEFAULT_THEME_TYPE
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

   beforeEach(() => {
      link = new LinkMock(name, theme);
      store = new Store();
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
         assert.sameMembers(store.getNames(), [name]);
         assert.sameMembers(store.getThemes(name), [theme]);
      });

      it('Добавление новой темы css', () => {
         const theme2 = 'dark-theme';
         const link2 = new LinkMock(name, theme2);
         store.set(link);
         store.set(link2);
         assert.deepEqual(store.get(name, theme), link);
         assert.deepEqual(store.get(name, theme2), link2);
         assert.sameMembers(store.getNames(), [name]);
         assert.sameMembers(store.getThemes(name), [theme, theme2]);
      });

      it('Добавление новой немультитемной темы css удаляет другие темы', () => {
         const theme2 = 'dark-theme';
         const link2 = new LinkMock(name, theme2, THEME_TYPE.SINGLE);
         store.set(link);
         store.set(link2);
         assert.isFalse(store.has(name, theme));
         assert.deepEqual(store.get(name, theme2), link2);
         assert.sameMembers(store.getNames(), [name]);
         assert.sameMembers(store.getThemes(name), [theme2]);
      });
   });

   describe('remove / require', () => {

      it('Удаление темы', async () => {
         store.set(link);
         const isRemoved = await store.remove(name, theme);
         assert.isTrue(isRemoved);
         assert.isFalse(store.has(name, theme));
         assert.sameMembers(store.getNames(), [name]);
         assert.sameMembers(store.getThemes(name), []);
      });

      it('Невозможно удалить тему, от которой зависят другие контролы', async () => {
         store.set(link);
         store.require(name, theme);
         const isRemoved = await store.remove(name, theme);
         assert.isFalse(isRemoved);
         assert.isTrue(store.has(name, theme));
         assert.sameMembers(store.getNames(), [name]);
         assert.sameMembers(store.getThemes(name), [theme]);
      });
   });
});

