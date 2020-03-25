import { Controller } from 'UI/theme/_controller/Controller';
// @ts-ignore
import { constants } from 'Env/Env';
import { THEME_TYPE } from 'UI/theme/_controller/css/const';
import Link from 'UI/theme/_controller/css/Link';
import { ICssLoader } from 'UI/theme/_controller/Loader';
import LinkPS from 'UI/theme/_controller/css/LinkPS';
import { assert } from 'chai';
import 'mocha';

describe('UI/theme/_controller/Controller', () => {

   const cssName = 'Some/Control';
   const themeName = 'Some/Theme';

   /** добавляем # в начало href, чтобы не сыпались ошибки о ненайденных стилях */
   const sharp = '#';
   class CssLoaderMock implements ICssLoader {
      loads: object = {};
      load(href: string): Promise<void> {
         const [sharp, name, theme]: string[] = href.split('-');
         if (!this.loads[name]) {
            this.loads[name] = {};
         }
         this.loads[name][theme] = this.loads[name][theme] ? this.loads[name][theme] + 1 : 1;
         return Promise.resolve(void 0);
      }
      getInfo(name: string, theme: string) {
         return {
            themeType: THEME_TYPE.MULTI,

            href: [sharp, name, theme].join('-')
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

   const setHooks = () => {

      beforeEach(() => {
         loader = new CssLoaderMock();
         controller = new Controller(loader);
      });

      afterEach(() => {
         return Promise.all(
            controller.getAll().map((link) => { link.remove(); })
         ).then(() => {
            controller = null;
            loader = null;
         });
      });
   };

   describe('get', () => {
      setHooks();

      it('Метод возвращает Promise<Link> на клиенте', () => {
         if (!constants.isBrowserPlatform) { return; }
         const getting = controller.get(cssName);

         assert.instanceOf(getting, Promise);

         return getting.then((css) => { assert.instanceOf(css, Link); });
      });

      it('Метод возвращает Promise<LinkPS> на СП', () => {
         if (!constants.isServerSide) { return; }
         const getting = controller.get(cssName);

         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, LinkPS); });
      });

      it('Загруженные стили не запрашиваются повторно', () => {
         if (!constants.isBrowserPlatform) { return; }
         return controller.get(cssName, themeName)
            .then(() => controller.get(cssName, themeName))
            .then(() => controller.get(cssName, themeName))
            .then(() => { assert.isTrue(loader.isValid()); });
      });

      it('Стили загружаются отдельно для каждой темы', () => {
         if (!constants.isBrowserPlatform) { return; }
         const theme2 = 'Another/Theme';
         return controller.get(cssName, themeName)
            .then(() => controller.get(cssName, theme2))
            .then(() => { assert.isTrue(loader.isValid()); });
      });
   });

   describe('getAll', () => {
      setHooks();

      it('Метод возвращает Link[] на клиенте', () => {
         if (!constants.isBrowserPlatform) { return; }
         const cssName2 = 'Another/Control';
         return controller.get(cssName)
            .then(() => controller.get(cssName2))
            .then(() => {
               controller.getAll()
                  .forEach((entity) => { assert.instanceOf(entity, Link); });
            });
      });

      it('Метод возвращает LinkPS[] на СП', () => {
         if (!constants.isServerSide) { return; }

         const cssName2 = 'Another/Control';
         return controller.get(cssName)
            .then(() => controller.get(cssName2))
            .then(() => {
               controller.getAll()
                  .forEach((entity) => { assert.instanceOf(entity, LinkPS); });
            });
      });
   });

   describe('has', () => {
      setHooks();

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
      setHooks();

      const name2 = 'Another/Control';
      const theme2 = 'Another/Theme';

      it('При установке темы запрашиваются стили для всех контролов', () => {
         return controller.get(cssName, themeName)
            .then(() => controller.get(name2, themeName))
            .then(() => controller.setTheme(theme2))
            .then(() => {
               assert.isTrue(controller.has(cssName, themeName));
               assert.isTrue(controller.has(name2, themeName));
               assert.isTrue(controller.has(cssName, theme2));
               assert.isTrue(controller.has(name2, theme2));
               assert.isTrue(loader.isValid());
            });
      });
   });

   describe('remove', () => {
      setHooks();

      it('невостребованные стили удаляются', () => {
         return controller.get(cssName)
            .then(() => controller.remove(cssName))
            .then((isRemoved) => {
               assert.isTrue(isRemoved);
               assert.isFalse(controller.has(cssName));
            });
      });

      it('востребованные стили не удаляются', () => {
         return controller.get(cssName)
            .then(() => controller.get(cssName))
            .then(() => controller.remove(cssName))
            .then((isRemoved) => {
               assert.isFalse(isRemoved);
               assert.isTrue(controller.has(cssName));
            });
      });

      it('попытка удалить несуществующие стили не приводит к ошибке', () => {
         return controller.remove(cssName).then((isRemoved) => {
            assert.isTrue(isRemoved);
            assert.isFalse(controller.has(cssName));
         })
            .catch((e: Error) => {
               assert.fail(e, void 0, 'попытка удалить несуществующие стили не приводит к ошибке');
            });
      });
   });
});
