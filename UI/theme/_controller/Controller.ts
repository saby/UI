/// <amd-module name='UI/theme/_controller/Controller' />
// @ts-ignore
import { cookie } from 'Env/Env';
import { Logger } from 'UI/Utils';
import { createEntity, restoreEntity, isLinkEntity, isSingleEntity } from 'UI/theme/_controller/CSS';
import { DEFAULT_THEME, EMPTY_THEME, THEME_TYPE } from 'UI/theme/_controller/css/const';
import { ICssEntity } from 'UI/theme/_controller/css/interface';
import Loader, { ICssLoader } from 'UI/theme/_controller/Loader';
import Storage from 'UI/theme/_controller/Storage';
/**
 * Контроллер тем, необходим для скачивания/удаления/коллекции/переключения тем на странице
 * @class UI/theme/_controller/Controller
 * @singleton
 */
export class Controller {
   private storage: Storage = new Storage();
   /** Имя темы приложения */
   appTheme: string = DEFAULT_THEME;

   constructor(private cssLoader: ICssLoader) {
      this.set = this.set.bind(this);
      this.has = this.has.bind(this);
      this.collectCssLinks();
   }

   /**
    * Получение экземпляра CssEntity по имени и теме
    * В случае отсутсвия сохранненого значения в Store
    *  - на СП `LinkPS` содержит имя контрола, тему, ссылку, строковое представление outerHtml link элемента
    *  - на клиенте `Link` содержит HTMLLinkElement, который монтируется в head
    * При повторном запросе востребованность темы возрастает
    */
   get(cssName: string, themeName?: string, themeType: THEME_TYPE = THEME_TYPE.MULTI): Promise<ICssEntity> {
      const theme = themeName || this.appTheme;
      const href = this.cssLoader.getHref(cssName, theme);
      // в случаях дополнительных безымянных css, cssName равно href, см. UI/theme/_controller/CSS:49
      const registeredName = this.has(cssName, theme) && cssName || this.has(href, theme) && href || null;
      if (registeredName) {
         const storedEntity = this.storage.get(registeredName, theme);
         storedEntity.require();
         /** Еще нескаченные css уже имеются в store, необходимо дождаться окончания монтирования в DOM */
         return storedEntity.loading.then(() => storedEntity);
      }
      const entity = createEntity(href, cssName, theme, themeType);
      /** Еще нескаченный link сохраняется в store, чтобы избежать повторного fetch */
      this.set(entity);
      return entity.load().then(() => {
         if (theme === EMPTY_THEME) { return entity; }
         /** Если link успешно скачан и вмонтирован в DOM, удаляем немультитемные стили */
         this.removeSingleEntities(entity.cssName, entity.themeName);
         return entity;
      }).catch((e: Error) =>
         /** Если стилей нет, удаляем link из Store */
         this.remove(cssName, theme).then(() => { throw decorateError(e); })
      );
   }

   /**
    * Получение всех сохраненных CssEntity
    */
   getAll(): ICssEntity[] {
      return this.storage.getAllCssNames()
         .map((name) => this.storage.getEntitiesBy(name))
         .reduce((prev, cur) => prev.concat(cur), []);
   }
   /**
    * Проверка наличия темы `themeName` у контрола `name`
    */
   has(cssName: string, themeName?: string): boolean {
      const theme = themeName || this.appTheme;
      return this.storage.has(cssName, theme);
   }

   isMounted(cssName: string, themeName?: string): boolean {
      const theme = themeName || this.appTheme;
      if (!this.storage.has(cssName, theme)) { return false; }
      return this.storage.get(cssName, theme).isMounted;
   }

   /**
    * Установить тему приложения
    * @param {string} themeName
    */
   setTheme(themeName: string): Promise<void> {
      if (!themeName || themeName === this.appTheme) {
         return Promise.resolve();
      }
      this.appTheme = themeName;
      const themeLoading: Array<Promise<ICssEntity>> = this.storage.getAllCssNames()
         .map((cssName): Promise<ICssEntity> | null => {
            const themes = this.storage.getThemeNamesFor(cssName);
            /** Скачиваем тему только темизированным css */
            if (themes.indexOf(EMPTY_THEME) !== -1 || themes.indexOf(themeName) !== -1) {
               return null;
            }
            const entity = this.storage.get(cssName, themes[0]);
            const themeType = isSingleEntity(entity) ? THEME_TYPE.SINGLE : THEME_TYPE.MULTI;
            return this.get(cssName, themeName, themeType);
         })
         .filter((loading): loading is Promise<ICssEntity> => loading instanceof Promise);
      return Promise.all(themeLoading).then(() => void 0);
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `cssName` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    */
   remove(cssName: string, themeName?: string): Promise<boolean> {
      const theme = themeName || this.appTheme;
      if (!this.has(cssName, theme)) {
         return Promise.resolve(true);
      }
      return this.storage.remove(cssName, theme);
   }

   clear(): void {
      this.storage.clear();
   }
   /**
    * Сохранение css сущности в store
    * @param link
    */
   private set(link: ICssEntity): void {
      this.storage.set(link);
   }
   /**
    * при добавлении темы, немультитемные темы должны удаляться,
    * т.к возникают конфликты селекторов (они одинаковые)
    */
   private removeSingleEntities(cssName: string, themeName: string): void {
      this.storage.getEntitiesBy(cssName)
         .filter(isSingleEntity)
         .filter((entity) => entity.themeName !== themeName)
         .forEach((singleLink) =>
            singleLink.removeForce()
               .then(() => this.storage.remove(singleLink.cssName, singleLink.themeName))
               .catch((e: Error) => { Logger.error(e.stack); })
         );
   }

   /**
    * Сбор всех ссылок на css из DOM,
    * и сохранение их в store
    */
   private collectCssLinks(): void {
      if (typeof document === 'undefined') { return; }
      Array
         .from(document.getElementsByTagName('link'))
         .map(restoreEntity)
         .filter(isLinkEntity)
         .forEach(this.set);
   }

   static instance: Controller;
   static getInstance(): Controller {
      if (typeof Controller.instance !== 'undefined') {
         return Controller.instance;
      }
      // @ts-ignore
      const buildMode = (1, eval)('this').contents?.buildMode;
      const isDebug = cookie.get('s3debug') === 'true' || buildMode === 'debug';
      Controller.instance = new Controller(new Loader(isDebug));
      return Controller.instance;
   }
}
function decorateError(e: Error): Error {
   return new Error(
      `UI/theme/controller
   ${e.message}
   It's probably an error with internet connection or CORS settings.`
   );
}
