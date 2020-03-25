/// <amd-module name='UI/theme/_controller/Controller' />
// @ts-ignore
import { HTTP } from 'Browser/_Transport/fetch/Errors';
// @ts-ignore
import { cookie } from 'Env/Env';
import { createEntity, restoreEntity, isLinkEntity, isSingleEntity } from 'UI/theme/_controller/CSS';
import { DEFAULT_THEME } from 'UI/theme/_controller/css/const';
import { ICssEntity } from 'UI/theme/_controller/css/interface';
import Loader, { ICssLoader } from 'UI/theme/_controller/Loader';
import Store from 'UI/theme/_controller/Store';
/**
 * Контроллер тем, необходим для скачивания/удаления/коллекции/переключения тем на странице
 * @class UI/theme/_controller/Controller
 * @singleton
 */
export class Controller {
   private store: Store<ICssEntity> = new Store<ICssEntity>();
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
   get(cssName: string, themeName?: string): Promise<ICssEntity> {
      const theme = themeName || this.appTheme;
      if (this.has(cssName, theme)) {
         const entity = this.store.get(cssName, theme);
         entity.require();
         return Promise.resolve(entity);
      }
      const { href, themeType } = this.cssLoader.getInfo(cssName, theme);
      const link = createEntity(href, cssName, theme, themeType);
      /** Еще нескаченный link сохраняется в store, чтобы избежать повторного fetch */
      this.set(link);
      return link.load(this.cssLoader).then(() => {
         /** Если link успешно скачан, удаляем немультитемные стили */
         this.removeSingleEntities(link);
         return link;
      }).catch(decorateError);
   }

   /**
    * Синхронное получение всех сохраненных Link'ов
    */
   getAll(): ICssEntity[] {
      return this.store.getCssNames()
         .map((name) => this.store.getEntitiesByName(name))
         .reduce((prev, cur) => prev.concat(cur), []);
   }
   /**
    * Проверка наличия темы `themeName` у контрола `name`
    */
   has(cssName: string, themeName?: string): boolean {
      const theme = themeName || this.appTheme;
      return this.store.has(cssName, theme);
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
      const themeLoading = this.store.getCssNames()
         .map((name) => this.get(name, themeName));
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
      return this.store.remove(cssName, theme);
   }

   /**
    * Сохранение css сущности в store
    * @param link
    */
   private set(link: ICssEntity): void {
      this.store.set(link);
   }
   /**
    * при добавлении темы, немультитемные темы должны удаляться,
    * т.к возникают конфликты селекторов (они одинаковые)
    */
   private removeSingleEntities(link: ICssEntity): void {
      this.store.getEntitiesByName(link.cssName)
         .filter(isSingleEntity)
         .filter((entity) => entity.themeName !== link.themeName)
         .forEach((singleLink) => singleLink.removeForce());
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
function decorateError(e: HTTP): never {
   throw new Error(
      `UI/theme/controller:\tCouldn't load: ${e.url}
      It's probably an error with internet connection or CORS settings.`
   );
}
