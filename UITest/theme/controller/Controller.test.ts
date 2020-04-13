import { Controller } from 'UI/theme/_controller/Controller';
// @ts-ignore
import { constants } from 'Env/Env';
import { THEME_TYPE, DEFAULT_THEME, EMPTY_THEME } from 'UI/theme/_controller/css/const';
import Link from 'UI/theme/_controller/css/Link';
import { ICssLoader } from 'UI/theme/_controller/Loader';
import LinkPS from 'UI/theme/_controller/css/LinkPS';
// import { assert } from 'chai';
// import 'mocha';

const cssName = 'Some/Control';
const themeName = 'Some/Theme';

/** добавляем # в начало href, чтобы не сыпались ошибки о ненайденных стилях */
const sharp = '#';
const createHref = (name: string, theme: string) => [sharp, name, theme].join('-');
class CssLoaderMock implements ICssLoader {
   loads: object = {};

   constructor(private forbidden: string[] = []) { }

   load(href: string): Promise<void> {
      if (this.forbidden.includes(href)) {
         return Promise.reject(new Error('theme is not exists'));
      }
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
         href: createHref(name, theme)
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
}

describe('UI/theme/_controller/Controller', () => {
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
            .then(() => { assert.isTrue(loader.isValid()); })
            .then(() => controller.remove(cssName, themeName))
            .then(() => controller.remove(cssName, themeName));
      });

      it('Стили загружаются отдельно для каждой темы', () => {
         if (!constants.isBrowserPlatform) { return; }
         const theme2 = 'Another/Theme';
         return controller.get(cssName, themeName)
            .then(() => controller.get(cssName, theme2))
            .then(() => { assert.isTrue(loader.isValid()); });
      });

      it('При ошибке скачивания стилей, link не сохраняется в Store', () => {
         if (!constants.isBrowserPlatform) { return; }
         const loader2 = new CssLoaderMock([createHref(cssName, themeName)]);
         const controller2 = new Controller(loader2);
         return controller2.get(cssName, themeName)
            .then(() => { assert.fail('При ошибке скачивания стилей должен возвращаться Rejected Promise'); })
            .catch((e) => {
               assert.isFalse(controller2.has(cssName, themeName));
            });
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

   describe('getThemes', () => {

      it('При отсутствии кастомной темы скачивается default тема', () => {
         if (!constants.isBrowserPlatform) { return; }
         const loader2 = new CssLoaderMock([createHref(cssName, themeName)]);
         const controller2 = new Controller(loader2);
         return controller2.getThemes(themeName, [cssName])
            .then(() => {
               assert.isFalse(controller2.has(cssName, themeName));
               assert.isTrue(controller2.has(cssName, DEFAULT_THEME));
               return controller2.remove(cssName, DEFAULT_THEME);
            });
      });

      it('При отсутствии кастомной и default темы возвращается Rejected Promise', () => {
         if (!constants.isBrowserPlatform) { return; }
         const loader2 = new CssLoaderMock([createHref(cssName, themeName), createHref(cssName, DEFAULT_THEME)]);
         const controller2 = new Controller(loader2);
         return controller2.getThemes(themeName, [cssName])
            .then(() => { assert.fail('При отсутствии кастомной и default темы возвращается Rejected Promise'); })
            .catch((e) => { assert.instanceOf(e, Error); });
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

      it('При установке темы не запрашиваются нетемизированные стили', () => {
         return controller.get(cssName, EMPTY_THEME)
            .then(() => controller.setTheme(themeName))
            .then(() => {
               assert.isTrue(controller.has(cssName, EMPTY_THEME));
               assert.isFalse(controller.has(cssName, themeName));
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
