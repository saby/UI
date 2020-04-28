/// <amd-module name='UI/theme/_controller/css/Base' />
import { ILoader, ICssEntity } from 'UI/theme/_controller/css/interface';
import { DEFAULT_THEME, THEME_TYPE } from 'UI/theme/_controller/css/const';

export abstract class Base implements ICssEntity {
   /** Тип темы */
   protected abstract themeType: THEME_TYPE;
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
      public themeName: string = DEFAULT_THEME
   ) {
      if (!href || !cssName) {
         throw new Error(`Invalid arguments href - ${href} or cssName - ${cssName}`);
      }
      this.remove = this.remove.bind(this);
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
