/// <amd-module name='UI/theme/_controller/Controller' />
// @ts-ignore
import { cookie, constants } from 'Env/Env';
import Loader, { ICssLoader, load } from 'UI/theme/_controller/Loader';
import Style from 'UI/theme/_controller/css/Style';
import Link from 'UI/theme/_controller/css/Link';
import { THEME_TYPE, EMPTY_THEME, ICssEntity } from 'UI/theme/_controller/css/Base';
import Store from 'UI/theme/_controller/Store';

/**
 * Контроллер тем, необходим для скачивания/удаления/коллекции/переключения тем на странице
 * @class UI/theme/_controller/Controller
 * @singleton
 */
export class Controller {
   private store: Store = new Store();
   appTheme: string = EMPTY_THEME;

   constructor(private cssLoader: ICssLoader) {
      this.get = this.get.bind(this);
      this.set = this.set.bind(this);
      this.has = this.has.bind(this);
      this.mount = this.mount.bind(this);
      this.remove = this.remove.bind(this);
      this.setTheme = this.setTheme.bind(this);
      this.collectCssLinks = this.collectCssLinks.bind(this);

      this.collectCssLinks();
   }

   /**
    * Получение экземпляра CssEntity по имени и теме
    * В случае отсутсвия сохранненого значения в Store
    *  - на СП создается `css/Link`, содержит имя контрола, тему, ссылку
    *  - на клиенте тема скачиватся и монтируется в DOM, возвращается `css/Style`
    * При повторном запросе востребованность темы возрастает
    */
   get(cssName: string, themeName?: string): Promise<ICssEntity> {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      if (this.has(cssName, theme)) {
         const entity = this.store.get(cssName, theme);
         entity.require();
         return Promise.resolve(entity);
      }
      const { href, themeType } = this.cssLoader.getInfo(cssName, theme);
      if (constants.isBrowserPlatform) {
         return load(href).then((css) => this.mount(css, cssName, theme, themeType));
      }
      const link = new Link(href, cssName, theme, themeType);
      this.set(link);
      return Promise.resolve(link);
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
    * @param entity 
    */
   private set(entity: ICssEntity): void {
      if (entity.themeType === THEME_TYPE.SINGLE) {
         /**
          * при переключении немультитемной темы остальные темы должны удаляться,
          * т.к возникают конфликты селекторов (они одинаковые)
          */
         this.store.clearThemes(entity.cssName);
      }
      this.store.set(entity);
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
   private mount(css: string, cssName: string, themeName: string, themeType: THEME_TYPE): ICssEntity {
      const style = Style.from(css, cssName, themeName, themeType);
      document.head.appendChild(style.element as HTMLStyleElement);
      this.set(style);
      return style;
   }

   static instance: Controller;
   static getInstance(): Controller {
      if (typeof Controller.instance !== undefined) {
         return Controller.instance;
      }
      Controller.instance = new Controller(new Loader());
      return Controller.instance;
   }
}
