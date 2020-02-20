/// <amd-module name='UI/theme/_controller/Controller' />
// @ts-ignore
import { cookie, constants } from 'Env/Env';
// @ts-ignore
import * as CssLoader from 'Core/CssLoader/CssLoader';
import Style, { replaceCssURL } from 'UI/theme/_controller/css/Style';
import Link from 'UI/theme/_controller/css/Link';
import { THEME_TYPE, DEFAULT_THEME, ICssEntity } from 'UI/theme/_controller/css/Base';
import Store from 'UI/theme/_controller/Store';

/**
 * Контроллер тем, необходим для скачивания/удаления/коллекции/переключения тем на странице
 * @class UI/theme/_controller/Controller
 * @singleton
 */
export class Controller {
   private store: Store = new Store();
   public appTheme: string = DEFAULT_THEME;

   constructor(private cssLoader: ICssLoader) {
      this.get = this.get.bind(this);
      this.has = this.has.bind(this);
      this.remove = this.remove.bind(this);
      this.setTheme = this.setTheme.bind(this);
      
      this.collectCssLinks();
   }

   /**
    * Получение экземпляра CssEntity по имени и теме
    * В случае отсутсвия сохранненого значения в Store
    *  - на СП создается `css/Link`, содержит имя контрола, тему, ссылку
    *  - на клиенте тема скачиватся и монтируется в DOM, возвращается `css/Style`
    * При повторном запросе востребованность темы возрастает
    */
   get(name: string, themeName?: string): Promise<ICssEntity> {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      if (this.has(name, theme)) {
         return Promise.resolve(this.store.get(name, theme).require());
      }
      if (constants.isServerSide) {
         const { href, isNewTheme } = this.cssLoader.getInfo(name, theme);
         const themeType = isNewTheme ? THEME_TYPE.MULTI : THEME_TYPE.SINGLE;
         const link = new Link(href, name, theme, themeType);
         return Promise.resolve(this.set(link));
      }
      return this.load(name, theme)
         .then(({ css, isNewTheme }) => this.mount(css, name, theme, isNewTheme));
   }

   /**
    * Проверка наличия темы `themeName` у контрола `name`
    */
   has(name: string, themeName?: string): boolean {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      return this.store.has(name, theme);
   }

   /**
    * Скачивание отсутвующей темы всем контролам
    * @param {string} theme
    */
   setTheme(theme: string): Promise<ICssEntity[]> {
      if (typeof theme === 'undefined' || theme === this.appTheme) {
         return Promise.resolve([]);
      }
      this.appTheme = theme;
      const themeLoading = this.store
         .getNames()
         .map((name) => this.get(name, theme));
      return Promise.all(themeLoading);
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `name` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    */
   remove(name: string, themeName?: string): Promise<boolean> {
      const theme = typeof themeName !== 'undefined' ? themeName : this.appTheme;
      return this.store.remove(name, theme);
   }

   /**
    * Сохранение css сущности в store
    * @param entity 
    */
   private set(entity: ICssEntity): ICssEntity {
      if (entity.themeType === THEME_TYPE.SINGLE) {
         /**
          * при переключении немультитемной темы остальные темы должны удаляться,
          * т.к возникают конфликты селекторов (они одинаковые)
          */
         this.store.clearThemes(entity.name);
      }
      return this.store.set(entity);
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
    * Загружает тему `theme` для контрола `name`
    * @returns {Promise<{css:string, isNewTheme:boolean}>} Возвращает Promise загрузки
    * @param name
    * @param theme
    */
   private load(name: string, theme: string) {
      return this.cssLoader
         .load(name, theme)
         .then(({ css, path, isNewTheme }) => ({ css: replaceCssURL(css, path), isNewTheme }));
   }

   /**
    * Монтирование style элемента со стилями в head, 
    * сохрание css/Style в Store
    */
   private mount(css: string, name: string, theme: string, isNewTheme: boolean) {
      const themeType = isNewTheme ? THEME_TYPE.MULTI : THEME_TYPE.SINGLE;
      const style = Style.from(css, name, theme, themeType);
      document.head.appendChild(<HTMLStyleElement> style.element);
      return this.set(style);
   }
}

let controller: Controller;
/**
 * @name UI/theme/_controller/Controller#getInstance
 * Функция, возвращаюшая экземпляр контроллера
 * @returns {Controller} controller
 */
export function getInstance() {
   if (typeof controller !== undefined) {
      return controller;
   }
   controller = new Controller(new CssLoader());
   return controller;
}

interface ICssLoader {
   getInfo(name: string, theme?: string): { isNewTheme: boolean, href: string; };
   load(name: string, theme: string): Promise<{ css: string, path: string; isNewTheme: boolean; }>;
}