import { Controller } from "UI/theme/_controller/Controller";
import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import { THEME_TYPE } from 'UI/theme/_controller/css/Base';
import Link from 'UI/theme/_controller/css/Link';
import { ICssLoader } from 'UI/theme/_controller/Loader';
import LinkSP from 'UI/theme/_controller/css/LinkSP';

describe('UI/theme/_controller/Controller', () => {
   const cssName = 'Some/Control1';
   const themeName = 'Some/Theme1';

   class CssLoaderMock implements ICssLoader {
      loads: object = {};
      load(href: string): Promise<void> {
         const [name, theme]: string[] = href.split('-');
         if (!this.loads[name]) {
            this.loads[name] = {};
         }
         this.loads[name][theme] = this.loads[name][theme] ? this.loads[name][theme] + 1 : 1;
         return Promise.resolve(void 0);
      }
      getInfo(name: string, theme: string) {
         return {
            themeType: THEME_TYPE.MULTI,
            href: [name, theme].join('-')
         };
      }
      /**
       * Загрузчик использовался правильно, если для каждой темы
       * стили загружались только 1 раз
       */
      isValid(): boolean {
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
      it('Метод возвращает Promise<Link> на клиенте', () => {
         if (!constants.isBrowserPlatform) { return; }
         const getting = controller.get(cssName);
         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, Link); });
      });

      it('Метод возвращает Promise<LinkSP> на СП', () => {
         if (!constants.isServerSide) { return; }
         const getting = controller.get(cssName);
         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, LinkSP); });
      });

      it('Загруженные стили не запрашиваются повторно', async () => {
         await controller.get(cssName, themeName);
         await controller.get(cssName, themeName);
         await controller.get(cssName, themeName);
         assert.isTrue(loader.isValid());
      });

      it('Стили загружаются отдельно для каждой темы', async () => {
         const theme2 = 'Another/Theme';
         await controller.get(cssName, themeName);
         await controller.get(cssName, theme2);
         assert.isTrue(loader.isValid());
      });
   });

   describe('getAll', () => {
      it('Метод возвращает Link[] ', () => {
         const cssName2 = 'Another/Control';
         Promise.all([
            controller.get(cssName),
            controller.get(cssName2)
         ]).then(() => {
            controller.getAll().forEach((entity) => {
               assert.instanceOf(entity, Link);
            });
         });
      });
   });

   describe('has', () => {
      it('Возвращает false для несохраненной темы', () => {
         assert.isFalse(controller.has(cssName));
      });

      it('Возвращает true для сохраненной темы', () => {
         return controller
            .get(cssName)
            .then(() => { assert.isTrue(controller.has(cssName)); });
      });
   });

   describe('setTheme', () => {
      const name2 = 'Another/Control';
      const theme2 = 'Another/Theme';

      it('При установке темы запрашиваются стили для всех контролов', async () => {
         await controller.get(cssName, themeName);
         await controller.get(name2, themeName);
         return controller.setTheme(theme2).then(() => {
            assert.isTrue(controller.has(cssName, themeName));
            assert.isTrue(controller.has(name2, themeName));
            assert.isTrue(controller.has(cssName, theme2));
            assert.isTrue(controller.has(name2, theme2));
            assert.isTrue(loader.isValid());
         });
      });
   });

   describe('remove', () => {

      it('невостребованные стили удаляются', (done) => {
         controller.get(cssName)
            .then(() => controller.remove(cssName))
            .then((isRemoved) => {
               assert.isTrue(isRemoved);
               assert.isFalse(controller.has(cssName));
            })
            .then(done, done);
      });

      it('востребованные стили не удаляются', (done) => {
         controller.get(cssName)
            .then(() => { controller.get(cssName); })
            .then(() => controller.remove(cssName))
            .then((isRemoved) => {
               assert.isFalse(isRemoved);
               assert.isTrue(controller.has(cssName));
            })
            .then(done, done);
      });
   });

   afterEach(() => {
      controller = null;
      loader = null;
   });
});
