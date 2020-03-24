/// <amd-module name='UI/theme/_controller/Store' />
import { ICssEntity } from 'UI/theme/_controller/css/interface';

type IThemesDescripion<T> = Partial<{ [theme: string]: T; }>;

/**
 * Хранилище тем
 */
export default class Store<T extends ICssEntity = ICssEntity> {
   private store: { [name: string]: IThemesDescripion<T>; } = Object.create(null);

   /**
    * Сохранить `entity` в Store
    */
   set(entity: T): void {
      if (this.getThemes(entity.cssName).length === 0) {
         this.store[entity.cssName] = { [entity.themeName]: entity };
         return;
      }
      this.store[entity.cssName][entity.themeName] = entity;
   }

   /**
    * Проверка наличия темы `theme` у контрола `name`
    */
   has(cssName: string, themeName: string): boolean {
      return !Object.is(this.store[cssName]?.[themeName], undefined);
   }

   /**
    * Получить тему `theme` для контрола `name`
    * Если темы нет в Store, выбрасывается исключение
    * @throws
    */
   get(cssName: string, themeName: string): T {
      if (!this.has(cssName, themeName)) {
         throw new Error(`CSS ${cssName} for ${themeName} theme is not exists!`);
      }
      return this.store[cssName][themeName];
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `name` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    */
   remove(cssName: string, themeName: string): Promise<boolean> {
      return this.get(cssName, themeName).remove().then((isRemoved) => {
         if (isRemoved) {
            delete this.store[cssName][themeName];
         }
         return isRemoved;
      });
   }

   /**
    * Возвращает массив имен контролов, для которых есть css в store
    */
   getNames(): string[] {
      return Object.keys(this.store);
   }

   /**
    * Возвращает массив ICssEntity, для которых есть css в store
    */
   getThemes(name: string): ICssEntity[] {
      return Object.keys(this.store?.[name] || []).map((theme) => this.get(name, theme));
   }
}
