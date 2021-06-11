import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import { Controller } from 'UICommon/theme/_controller/Controller';
import Link from 'UICommon/theme/_controller/css/Link';
import LinkPS from 'UICommon/theme/_controller/css/LinkPS';
import { ICssLoader } from 'UICommon/theme/_controller/Loader';

const cssName = 'Some/Control';
const themeName = 'Some/Theme';

/** добавляем # в начало href, чтобы не сыпались ошибки о ненайденных стилях */
const sharp = '#';
const createValidHref = (name: string, theme: string) => [sharp, name, theme].join('-');
const createBrokenHref = (name: string, theme: string) => [name, theme].join('-');
class CssLoaderMock implements ICssLoader {
   loads: object = {};

   constructor(private createHref: (name: string, theme: string) => string = createValidHref) {
      this.getHref = this.getHref.bind(this);
   }

   getHref(name: string, theme: string): string {
      return this.createHref(name, theme);
   }
}

const describeIf = (condition) => condition ? describe : describe.skip;

describe('UICommon/theme/_controller/Controller', () => {
   const loader: CssLoaderMock = new CssLoaderMock();
   const controller: Controller = new Controller(loader);

   afterEach(() =>
       Promise
           .all(controller.getAll().map((link) => link.remove()))
           .then(controller.clear)
   );

   describeIf(constants.isBrowserPlatform)('get', () => {
      it('Метод возвращает Promise<Link> на клиенте', () => {
         const getting = controller.get(cssName);
         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, Link); });
      });

      it('Метод возвращает Promise<LinkPS> на СП', () => {
         const getting = controller.get(cssName);
         assert.instanceOf(getting, Promise);
         return getting.then((css) => { assert.instanceOf(css, LinkPS); });
      });

      it('Загруженные стили не запрашиваются повторно', () => {
         return controller.get(cssName, themeName)
            .then(() => controller.get(cssName, themeName))
            .then(() => controller.get(cssName, themeName))
            .then(() => controller.remove(cssName, themeName))
            .then(() => controller.remove(cssName, themeName));
      });

      it('Стили загружаются отдельно для каждой темы', () => {
         const theme2 = 'Another/Theme';
         return controller.get(cssName, themeName)
            .then(() => controller.get(cssName, theme2));
      });

      it('При ошибке скачивания стилей, link не сохраняется в Store', () => {
         const loader2 = new CssLoaderMock(createBrokenHref);
         const controller2 = new Controller(loader2);
         return controller2.get(cssName, themeName)
            .then(() => { assert.fail('При ошибке скачивания стилей должен возвращаться Rejected Promise'); })
            .catch((_e) => {
               assert.isFalse(controller2.has(cssName, themeName));
            });
      });
   });

   describeIf(constants.isBrowserPlatform)('getAll', () => {
      it('Метод возвращает Link[] на клиенте', () => {
         const cssName2 = 'Another/Control';
         return controller.get(cssName)
            .then(() => controller.get(cssName2))
            .then(() => {
               controller.getAll()
                  .forEach((entity) => { assert.instanceOf(entity, Link); });
            });
      });

      it('Метод возвращает LinkPS[] на СП', () => {
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
      it('Возвращает false для несохраненной темы', () => {
         assert.isFalse(controller.has(cssName));
      });

      it('Возвращает true для сохраненной темы', () => {
         return controller
            .get(cssName)
            .then(() => { assert.isTrue(controller.has(cssName)); });
      });
   });

   describe('remove', () => {
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

   describe('define', () => {
      const aliasName = 'alias_name_1';
      const originalName = 'original_name_1';
      const aliasName2 = 'alias_name_2';
      const originalName2 = 'original_name_2';
      const aliases = {
         [aliasName]: originalName,
         [aliasName2]: originalName2
      };

      it('Метод get при запросе алиаса возвращает css-сущность с оригинальным именем', () => {
         controller.define(aliases);
         return controller.get(aliasName).then((entity) => {
            assert.strictEqual(entity.cssName, originalName);
         });
      });

      it('Метод has возвращает true для алиаса и оригинального имени', () => {
         controller.define(aliases);
         return controller.get(aliasName).then(() => {
            assert.isTrue(controller.has(originalName));
            assert.isTrue(controller.has(aliasName));
         });
      });

      it('Метод getAll возвращает те же css-сущности при запросе алиасов и оригинальных имен', () => {
         controller.define(aliases);
         return Promise.all([
            Promise.all([controller.get(aliasName), controller.get(aliasName2)]),
            Promise.all([controller.get(originalName), controller.get(originalName2)])
         ]).then(([aliasEntities, originalEntities]) => {
            assert.sameDeepMembers(aliasEntities, originalEntities);
         });
      });

      it('Метод remove удаляет по алиасу', () => {
         controller.define(aliases);
         return controller.get(originalName)
            .then(() => controller.remove(aliasName))
            .then((isRemoved) => {
               assert.isTrue(isRemoved, 'не удалось удалить css сущность');
               assert.isFalse(controller.has(aliasName), 'Алиас остался в хранилище');
               assert.isFalse(controller.has(originalName), 'Оригинал остался в хранилище');
            });
      });
   });
});
