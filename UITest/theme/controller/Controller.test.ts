import { Controller } from "UI/theme/_controller/Controller";
import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import Style from 'UI/theme/_controller/css/Style';
import { DEFAULT_THEME } from 'UI/theme/_controller/css/Base';
import Link from 'UI/theme/_controller/css/Link';

describe('UI/theme/_controller/Controller', () => {
   const name = 'Some/Control1';
   const theme = 'Some/Theme1';
   const cssStyle = 'style';

   class CssLoaderMock {
      loads = {};
      load(name, theme = DEFAULT_THEME) {
         if (!this.loads[name]) {
            this.loads[name] = {};
         }
         this.loads[name][theme] = this.loads[name][theme] ? this.loads[name][theme] + 1 : 1;
         return Promise.resolve({
            css: cssStyle,
            path: 'href',
            isNewTheme: true
         });
      }
      getInfo() {
         return {
            isNewTheme: true,
            href: 'href'
         };
      }
      /** 
       * Загрузчик использовался правильно, если для каждой темы
       * стили загружались только 1 раз
       */
      isValid() {
         if (!constants.isBrowserPlatform) { return true; }
         return Object.keys(this.loads).every((name) =>
            Object.keys(this.loads[name]).every((theme) =>
               this.loads[name][theme] === 1)
         );
      }
   };

   let controller: Controller;
   let loader: CssLoaderMock;

   beforeEach(() => {
      loader = new CssLoaderMock();
      controller = new Controller(loader);
   });

   describe('get', () => {
      it('Метод возвращает Promise<Style> на клиенте', () => {
         if (!constants.isBrowserPlatform) { return; }
         const getting = controller.get(name);
         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, Style); });
      });

      it('Метод возвращает Promise<Link> на СП', () => {
         if (!constants.isServerSide) { return; }
         const getting = controller.get(name);
         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, Link); });
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

   describe('has', () => {
      it('Возвращает false для несохраненной темы', () => {
         assert.isFalse(controller.has(name));
      });

      it('Возвращает true для сохраненной темы', () => {
         return controller
            .get(name)
            .then(() => { assert.isTrue(controller.has(name)); });
      });
   });

   describe('setTheme', () => {
      const name2 = 'Another/Control';
      const theme2 = 'Another/Theme';

      it('При установке темы запрашиваются стили для всех контролов', async () => {
         await controller.get(name, theme);
         await controller.get(name2, theme);
         return controller.setTheme(theme2).then(() => {
            assert.isTrue(controller.has(name, theme));
            assert.isTrue(controller.has(name2, theme));
            assert.isTrue(controller.has(name, theme2));
            assert.isTrue(controller.has(name2, theme2));
            assert.isTrue(loader.isValid());
         });
      });

      it('setTheme возвращает массив Style на клиенте', async () => {
         if (!constants.isBrowserPlatform) { return; }
         await controller.get(name, theme);
         await controller.get(name2, theme);
         return controller.setTheme(theme2).then((links) => {
            assert.isTrue(loader.isValid());
            links.forEach((link) => { assert.instanceOf(link, Style); });
         });
      });

      it('setTheme возвращает массив Link на СП', async () => {
         if (!constants.isServerSide) { return; }
         await controller.get(name, theme);
         await controller.get(name2, theme);
         return controller.setTheme(theme2).then((links) => {
            assert.isTrue(loader.isValid());
            links.forEach((link) => { assert.instanceOf(link, Link); });
         });
      });
   });

   describe('remove', () => {

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

