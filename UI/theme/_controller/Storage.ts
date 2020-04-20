/// <amd-module name='UI/theme/_controller/Storage' />
import { ICssEntity } from 'UI/theme/_controller/css/interface';
import { getStore, setStore } from 'Application/Env';
import { isInit } from 'Application/Initializer';
import { IStore } from 'Application/Interface';
import { constants } from 'Env/Env';

type IThemesDescripion<T> = Partial<{ [theme: string]: T; }>;

/**
 * Хранилище тем
 */
export default class Storage {
   constructor(
      private store: IStore<IEntities> = createEntityStore()
   ) { }
   /**
    * Сохранить `entity` в Store
    */
   set(entity: ICssEntity): void {
      if (this.getThemeNames(entity.cssName).length === 0) {
         this.store.set(entity.cssName, { [entity.themeName]: entity });
         return;
      }
      this.store.set(entity.cssName, { ...this.store.get(entity.cssName), [entity.themeName]: entity });
   }

   /**
    * Проверка наличия темы `theme` у контрола `name`
    */
   has(cssName: string, themeName: string): boolean {
      return typeof this.store.get(cssName)?.[themeName] !== 'undefined';
   }

   /**
    * Получить тему `theme` для контрола `name`
    * Если темы нет в Store, выбрасывается исключение
    * @throws
    */
   get(cssName: string, themeName: string): ICssEntity {
      if (!this.has(cssName, themeName)) {
         throw new Error(`CSS ${cssName} for ${themeName} theme is not exists!`);
      }
      return this.store.get(cssName)[themeName];
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `name` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    */
   remove(cssName: string, themeName: string): Promise<boolean> {
      return this.get(cssName, themeName).remove().then((isRemoved) => {
         if (isRemoved) {
            const themes = this.store.get(cssName);
            delete themes[themeName];
            this.store.set(cssName, themes);
         }
         return isRemoved;
      });
   }

   clear(): void {
      this.store = createEntityStore();
   }
   /**
    * Возвращает массив имен css в store
    */
   getCssNames(): string[] {
      return this.store.getKeys();
   }
   /**
    * Возвращает массив ICssEntity всех сохраненных тем по имени
    */
   getEntitiesByName(cssName: string): ICssEntity[] {
      return this.getThemeNames(cssName).map((theme) => this.get(cssName, theme));
   }

   /**
    * Возвращает массив имен тем для cssName
    */
   getThemeNames(cssName: string): string[] {
      return Object.keys(this.store.get(cssName) || []);
   }
}

interface IEntities { [name: string]: IThemesDescripion<ICssEntity>; }

class EntityStore implements IStore<IEntities> {
   private data: IEntities = Object.create(null);

   get<K extends keyof IEntities>(id: K): IEntities[K] {
      return this.data[id];
   }
   set<K extends keyof IEntities>(id: K, state: IEntities[K]): boolean {
      this.data[id] = state;
      return true;
   }
   remove(id: keyof IEntities): void {
      delete this.data[id];
   }
   getKeys(): Array<keyof IEntities & string> {
      return Object.keys(this.data) as Array<keyof IEntities & string>;
   }
   toObject(): { [key in keyof IEntities]: IEntities[key] } {
      return this.data;
   }

   static label: string = 'UI/theme/_controller/Storage#CssEntityStore';
}

function createEntityStore(): IStore<IEntities> {
   if (constants.isBrowserPlatform || !isInit()) {
      /**
       * Для случаев, когда приложение не инициализированно (unit-тесты)
       * используется локальный EntityStore
       */
      return new EntityStore();
   }
   /**
    * на СП используется Application Store, чтобы css разных потоков не перемешивались,
    * т.к theme/controller является singleton'ом
    */
   const createDefaultStore = (): EntityStore => new EntityStore();
   setStore<IEntities>(EntityStore.label, createDefaultStore());
   return getStore<IEntities>(EntityStore.label, createDefaultStore);
}
