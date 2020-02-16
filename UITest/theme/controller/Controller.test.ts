import { Controller } from "UI/theme/_controller/Controller";
import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import 'mocha';
import CssLink from 'UI/theme/_controller/CssLink';
import CssLinkSP, { THEME_TYPE, DEFAULT_THEME } from 'UI/theme/_controller/CssLinkSP';

describe('UI/theme/_controller/Controller', () => {
   const name = 'Some/Control1';
   const theme = 'Some/Theme1';
   const cssStyle = 'style';

   class LinkResolverMock {
      fixOld = (name) => name;
      isNewTheme = () => true;
      resolveLink = (link: string) => link;
   };

   class CssLoaderMock {
      loads = {};
      loadCssThemedAsync(name, theme = DEFAULT_THEME) {
         if (!this.loads[name]) {
            this.loads[name] = {};
         }
         this.loads[name][theme] = this.loads[name][theme] ? this.loads[name][theme] + 1 : 1;
         return Promise.resolve(cssStyle);
      }
      /** 
       * Загрузчик использовался правильно, если для каждой темы
       * стили загружались только 1 раз
       */
      isValid() {
         return Object.keys(this.loads).every((name) =>
            Object.keys(this.loads[name]).every((theme) =>
               this.loads[name][theme] === 1)
         );
      }
   };

   let controller: Controller;
   let loader: CssLoaderMock;
   let resolver: LinkResolverMock;

   beforeEach(() => {
      resolver = new LinkResolverMock();
      loader = new CssLoaderMock();
      controller = new Controller(resolver, loader);
   });

   describe('get', () => {
      /** тестируется только в браузере, т.к необходимо монтировать style в DOM */
      if (!constants.isBrowserPlatform) { return; }

      it('Метод возвращает Promise<CssLink>', () => {
         const getting = controller.get(name);
         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, CssLink); });
      });

      it('Загруженные стили не запрашиваются повторно', async () => {
         await controller.get(name);
         await controller.get(name, theme);
         await controller.get(name);
         assert.isTrue(loader.isValid());
      });

      it('Стили загружаются отдельно для каждой темы', async () => {
         const theme2 = 'Another/Theme';
         await controller.get(name, theme);
         await controller.get(name, theme2);
         assert.isTrue(loader.isValid());
      });
   });

   describe('set', () => {

      it('Метод сохраняет CssLinkSP', () => {
         const link = new CssLinkSP(name, theme);
         controller.set(link);
         return controller.get(name, theme).then((l) => { assert.deepEqual(l, link); });
      });

      
      it('Добавление новой немультитемной темы css удаляет другие темы', () => {
         const theme2 = 'dark-theme';
         const link = new CssLinkSP(name, theme);
         const link2 = new CssLinkSP(name, theme2, THEME_TYPE.SINGLE);
         controller.set(link);
         controller.set(link2);
         assert.isFalse(controller.has(name, theme));
         assert.isTrue(controller.has(name, theme2));
      });
   });

   describe('has', () => {
      it('Возвращает false для несохраненной темы', () => {
         assert.isFalse(controller.has(name));
      });

      it('Возвращает true для сохраненной темы', () => {
         if (!constants.isBrowserPlatform) { return; }
         return controller
            .get(name)
            .then(() => { assert.isTrue(controller.has(name)); });
      });
   });

   describe('setTheme', () => {
      if (!constants.isBrowserPlatform) { return; }

      const name2 = 'Another/Control';
      const theme2 = 'Another/Theme';

      it('При установке темы запрашиваются стили для всех контролов', async () => {
         await controller.get(name, theme);
         await controller.get(name2, theme);
         return controller.setTheme(theme2).then(() => {
            assert.isTrue(loader.isValid());
            assert.isTrue(controller.has(name, theme));
            assert.isTrue(controller.has(name2, theme));
            assert.isTrue(controller.has(name, theme2));
            assert.isTrue(controller.has(name2, theme2));
         });
      });

      it('setTheme возвращает массив CssLink', async () => {
         await controller.get(name, theme);
         await controller.get(name2, theme);
         return controller.setTheme(theme2).then((links) => {
            assert.isTrue(loader.isValid());
            links.forEach((link) => { assert.instanceOf(link, CssLink); });
         });
      });
   });

   describe('remove', () => {
      /** .get используется только в браузере */
      if (!constants.isBrowserPlatform) { return; }

      it('невостребованные стили удаляются', async () => {
         await controller.get(name);
         const isRemoved = await controller.remove(name);
         assert.isTrue(isRemoved);
         assert.isFalse(controller.has(name));
      });

      it('востребованные стили не удаляются', async () => {
         await controller.get(name);
         await controller.get(name);
         const isRemoved = await controller.remove(name);
         assert.isFalse(isRemoved);
         assert.isTrue(controller.has(name));
      });

   });
});

