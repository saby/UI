/// <amd-module name='UI/theme/_controller/Controller' />
// @ts-ignore
import { cookie, constants } from 'Env/Env';
// @ts-ignore
import * as CssLoader from 'Core/CssLoader/CssLoader';
// @ts-ignore
import LinkResolver = require('Core/LinkResolver/LinkResolver');

import CssLink, {replaceCssURL, THEME_TYPE } from 'UI/theme/_controller/CssLink';
import Store from 'UI/theme/_controller/Store';
/**
 * Контроллер тем 
 * @class UI/theme/_controller/Controller
 * @singleton
 */
export class Controller {
   private store: Store = new Store();

   constructor(
      private linkResolver: ILinkResolver,
      private cssLoader: ICssLoader
   ) {
      this.collectCss();
   }

   /**
    * Загружает тему `theme` для контрола `controlName`
    * @returns {Promsie<string>} Возвращает Promise<cssStyle> загрузки
    * @param controlName
    * @param theme
    */
   private load(controlName: string, theme: string = CssLink.DEFAULT_THEME): Promise<string> {
      const name = this.linkResolver.fixOld(controlName);
      const path = this.linkResolver.resolveLink(name, { ext: 'css', theme });
      return this.cssLoader
         .loadCssThemedAsync(name, theme)
         .then((css) => replaceCssURL(css, path));
   }

   /**
    * Монтирование style элемента со стилями в head, 
    * сохрание CssLink в Store
    */
   private mount(css: string, name: string, theme: string = CssLink.DEFAULT_THEME) {
      const themeType = this.linkResolver.isNewTheme(name, theme) ? THEME_TYPE.MULTI : THEME_TYPE.SINGLE;
      const link = CssLink.create(css, name, theme, themeType);
      document.head.appendChild(<HTMLStyleElement> link.element);
      return this.store.set(link);
   }

   /**
    * Получение экземпляра CssLink по имени и теме
    * В случае отсутсвия сохранненого значения в Store возвращается процесс загрузки стилей
    * При повторном запросе востребованность темы возрастает
    */
   get(name: string, theme: string = CssLink.DEFAULT_THEME) {
      if (this.has(name, theme)) {
         return Promise.resolve(this.store.get(name, theme).require());
      }
      return this.load(name, theme).then((css) => this.mount(css, name, theme));
   }

   /**
    * Проверка наличия темы `theme` у контрола `controlName`
    * @param name
    * @param theme
    */
   has(controlName: string, theme: string = CssLink.DEFAULT_THEME): boolean {
      const name = this.linkResolver.fixOld(controlName);
      return this.store.has(name, theme);
   }

   /**
    * Скачивание отсутвующей темы всем контролам
    * @param {string} theme
    */
   setTheme(theme: string) {
      const themeLoading = this.store
         .getNames()
         .map((name) => this.get(name, theme));
      return Promise.all(themeLoading);
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `controlName` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    * @param controlName
    * @param theme
    */
   remove(controlName: string, theme: string = CssLink.DEFAULT_THEME): Promise<boolean> {
      const name = this.linkResolver.fixOld(controlName);
      return this.store.remove(name, theme);
   }

   private collectCss(): void {
      if (typeof document === 'undefined') { return; }
      const singleThemeClass = 'css-bundles';
      const multiThemeClass = 'new-styles';

      const signleLinks = Array
         .from(document.getElementsByClassName(singleThemeClass))
         .map((link: HTMLLinkElement) => new CssLink(link, THEME_TYPE.SINGLE));

      const multiLinks: CssLink[] = Array
         .from(document.getElementsByClassName(multiThemeClass))
         .map((link: HTMLLinkElement) => new CssLink(link, THEME_TYPE.MULTI));

      [...signleLinks, ...multiLinks].forEach(this.store.set);
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
   const isDebug = cookie.get('s3debug') === 'true' || (1, eval)('this').contents?.buildMode === 'debug';
   const { buildnumber, wsRoot, appRoot, resourceRoot } = constants;
   const linkResolver = new LinkResolver(isDebug, buildnumber, wsRoot, appRoot, resourceRoot);
   const cssLoader = new CssLoader(this.linkResolver);
   controller = new Controller(linkResolver, cssLoader);
   return controller;
}

interface ILinkResolver {
   fixOld(name: string): string;
   isNewTheme(name: string, theme: string): boolean;
   resolveLink(name: string, cfg: { ext: string, theme: string; }): string;
}

interface ICssLoader {
   loadCssThemedAsync(name: string, theme: string): Promise<string>;
}