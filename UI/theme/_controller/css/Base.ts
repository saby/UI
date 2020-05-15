/// <amd-module name='UI/theme/_controller/css/Base' />
import { ICssEntity } from 'UI/theme/_controller/css/interface';
import { DEFAULT_THEME, THEME_TYPE, ELEMENT_ATTR } from 'UI/theme/_controller/css/const';

export abstract class Base implements ICssEntity {
   outerHtml: string = '';
   isMounted: boolean = false;
   loading: Promise<void> = Promise.resolve();

   /**
    * Скольким контролам требуется данная css
    * Если 0 - удаляем
    */
   protected requirement: number = 0;

   constructor(
      public href: string,
      public cssName: string,
      public themeName: string = DEFAULT_THEME,
      public themeType: THEME_TYPE = THEME_TYPE.MULTI
   ) {
      if (!href || !cssName) {
         throw new Error(`Invalid arguments href - ${href} or cssName - ${cssName}`);
      }
      this.remove = this.remove.bind(this);
      this.outerHtml = getHtmlMarkup(href, cssName, themeName, themeType);
   }

   require(): void {
      this.requirement++;
   }

   remove(): Promise<boolean> {
      if (this.requirement === 0) {
         this.isMounted = false;
         return Promise.resolve(true);
      }
      this.requirement--;
      return Promise.resolve(false);
   }

   abstract load(): Promise<void>;
}

export function getHtmlMarkup(href: string, name: string, theme: string, themeType: THEME_TYPE): string {
   return '<link rel="stylesheet" type="text/css" data-vdomignore="true" ' +
      `${ELEMENT_ATTR.THEME_TYPE}="${themeType}" ` +
      `${ELEMENT_ATTR.THEME}="${theme}" ` +
      `${ELEMENT_ATTR.NAME}="${name}" ` +
      `${ELEMENT_ATTR.HREF}="${href}"/>`;
}