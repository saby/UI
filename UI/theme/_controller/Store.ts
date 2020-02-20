/// <amd-module name='UI/theme/_controller/Store' />
import { ICssEntity } from 'UI/theme/_controller/css/Base';

type IThemesDescripion<T> = Partial<{ [theme: string]: T; }>;

/**
 * Хранилище тем
 */
export default class Store<T extends ICssEntity = ICssEntity> {
   private store: { [name: string]: IThemesDescripion<T>; } = Object.create(null);

   constructor() {
      this.set = this.set.bind(this);
      this.get = this.get.bind(this);
      this.has = this.has.bind(this);
      this.remove = this.remove.bind(this);
      this.getNames = this.getNames.bind(this);
      this.getThemes = this.getThemes.bind(this);
   }

   /**
    * Сохранить `entity` в Store
    */
   set(entity: T): T {
      if (this.getThemes(entity.name).length === 0) {
         this.store[entity.name] = { [entity.theme]: entity };
         return entity;
      }
      this.store[entity.name][entity.theme] = entity;
      return entity;
   }

   /**
    * Проверка наличия темы `theme` у контрола `name`
    */
   has(name: string, theme: string): boolean {
      return !Object.is(this.store[name]?.[theme], undefined);
   }

   /**
    * Получить тему `theme` для контрола `name`
    * Если темы нет в Store, выбрасывается исключение
    * @throws
    */
   get(name: string, theme: string): T {
      if (!this.has(name, theme)) {
         throw new Error(`CSS ${name} for ${theme} theme is not exists!`);
      }
      return this.store[name][theme];
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `name` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    */
   remove(name: string, theme: string): Promise<boolean> {
      return this.get(name, theme).remove().then((isRemoved) => {
         if (isRemoved) {
            delete this.store[name][theme];
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
    * Удаление всех тем для контрола `name`
    */
   clearThemes(name: string): void {
      const forceRemove = true;
      this.getThemes(name)
         .map((theme) => this.store[name][theme])
         .forEach((link) => link.remove(forceRemove));

      this.getThemes(name)
         .forEach((theme) => { delete this.store[name][theme]; });
   }

   /**
    * Возвращает массив тем контролов, для которых есть css в store
    */
   private getThemes(name: string): string[] {
      return Object.keys(this.store?.[name] || []);
   }
}
