/// <amd-module name='UI/theme/_controller/Controller' />
import { THEME_TYPE, DEFAULT_THEME, ICssEntity } from 'UI/theme/_controller/css/Base';
import Loader, { ICssLoader } from 'UI/theme/_controller/Loader';
import Link from 'UI/theme/_controller/css/Link';
import Store from 'UI/theme/_controller/Store';
import { constants, cookie } from 'Env/Env';

/**
 * Контроллер тем, необходим для скачивания/удаления/коллекции/переключения тем на странице
 * @class UI/theme/_controller/Controller
 * @singleton
 */
export class Controller {
   private store: Store<Link> = new Store<Link>();
   /** Имя темы приложения */
   appTheme: string = DEFAULT_THEME;

   constructor(private cssLoader: ICssLoader) {
      this.set = this.set.bind(this);
      this.collectCssLinks();
   }

   /**
    * Получение экземпляра CssEntity по имени и теме
    * В случае отсутсвия сохранненого значения в Store создается экземпляр `Link`
    *  - на СП `Link` содержит имя контрола, тему, ссылку, строковое представление outerHtml link элемента
    *  - на клиенте `Link` содержит HTMLLinkElement, который монтируется в head
    * При повторном запросе востребованность темы возрастает
    */
   get(cssName: string, themeName?: string): Promise<Link> {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      if (this.has(cssName, theme)) {
         const entity = this.store.get(cssName, theme);
         entity.require();
         return Promise.resolve(entity);
      }
      const { href, themeType } = this.cssLoader.getInfo(cssName, theme);
      if (constants.isServerSide) {
         const link = new Link(href, cssName, theme, themeType);
         this.set(link);
         return Promise.resolve(link);
      }
      /**
       * На клиенте делаем fetch для новых стилей и игнориуем результат т.к монтируем в head стили как link элемент.
       * Браузер кэширует запрошенные через fetch стили, повторной загрузки не будет, а ошибки загрузки перехватываются.
       */
      return this.cssLoader.load(href).then(() => {
         const link = Link.create(href, cssName, theme, themeType);
         this.mount(link);
         this.set(link);
         return link;
      });
   }

   /**
    * Синхронное получение всех сохраненных ICssEntity сущностей
    */
   getAll(themeName?: string): ICssEntity[] {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      return this.store.getNames().map((name) => this.store.get(name, theme));
   }
   /**
    * Проверка наличия темы `themeName` у контрола `name`
    */
   has(cssName: string, themeName?: string): boolean {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      return this.store.has(cssName, theme);
   }

   /**
    * Скачивание отсутвующей темы всем контролам
    * @param {string} themeName
    */
   setTheme(themeName: string): Promise<void> {
      if (typeof themeName === 'undefined' || themeName === this.appTheme) {
         return Promise.resolve();
      }
      this.appTheme = themeName;
      const themeLoading = this.store
         .getNames()
         .map((name) => this.get(name, themeName));
      return Promise.all(themeLoading).then(() => void 0);
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `name` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    */
   remove(cssName: string, themeName?: string): Promise<boolean> {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      return this.store.remove(cssName, theme);
   }

   /**
    * Сохранение css сущности в store
    * @param link
    */
   private set(link: Link): void {
      if (link.themeType === THEME_TYPE.SINGLE) {
         /**
          * при переключении немультитемной темы остальные темы должны удаляться,
          * т.к возникают конфликты селекторов (они одинаковые)
          */
         this.store.clearThemes(link.cssName);
      }
      this.store.set(link);
   }

   /**
    * Сбор всех ссылок на css из DOM,
    * и сохранение их в store
    */
   private collectCssLinks(): void {
      if (typeof document === 'undefined') { return; }
      Array
         .from(document.getElementsByTagName('link'))
         .map(Link.from)
         .forEach(this.set);
   }

   /**
    * Монтирование style элемента со стилями в head,
    * сохрание css/Style в Store
    */
   private mount(link: Link): void {
      document.head.appendChild(link.element as HTMLLinkElement);
   }

   static instance: Controller;
   static getInstance(): Controller {
      if (typeof Controller.instance !== 'undefined') {
         return Controller.instance;
      }
      const buildMode = (1, eval)('this').contents?.buildMode;
      const isDebug = cookie.get('s3debug') === 'true' || buildMode === 'debug';
      Controller.instance = new Controller(new Loader(isDebug));
      return Controller.instance;
   }
}
