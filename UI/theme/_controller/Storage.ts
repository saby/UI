/// <amd-module name='UI/theme/_controller/Storage' />
import { ICssEntity } from 'UI/theme/_controller/css/interface';
import { getStore as getAppStore, setStore as setAppStore } from 'Application/Env';
import { IStore } from 'Application/Interface';
// @ts-ignore
import { constants } from 'Env/Env';

type IThemesDescripion = Partial<{ [theme: string]: ICssEntity; }>;
interface IEntities { [name: string]: IThemesDescripion; }

/**
 * Хранилище тем
 */
export default class Storage {
   constructor(
      private getStore: () => IStore<IEntities> = createEntityStore()
   ) { }
   /**
    * Сохранить `entity` в Store
    */
   set(entity: ICssEntity): void {
      const store = this.getStore();
      if (this.getThemeNamesFor(entity.cssName).length === 0) {
         store.set(entity.cssName, { [entity.themeName]: entity });
         return;
      }
      store.set(entity.cssName, { ...store.get(entity.cssName), [entity.themeName]: entity });
   }

   /**
    * Проверка наличия темы `theme` у контрола `name`
    */
   has(cssName: string, themeName: string): boolean {
      return typeof this.getStore().get(cssName)?.[themeName] !== 'undefined';
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
      return this.getStore().get(cssName)[themeName];
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `name` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    */
   remove(cssName: string, themeName: string): Promise<boolean> {
      return this.get(cssName, themeName).remove().then((isRemoved) => {
         if (isRemoved) {
            const themes = this.getStore().get(cssName);
            delete themes[themeName];
            this.getStore().set(cssName, themes);
         }
         return isRemoved;
      });
   }

   clear(): void {
      this.getStore = createEntityStore();
   }

   /**
    * Возвращает массив имен css в store
    */
   getAllCssNames(): string[] {
      return this.getStore().getKeys();
   }

   /**
    * Возвращает массив имен тем для cssName
    */
   getThemeNamesFor(cssName: string): string[] {
      return Object.keys(this.getStore().get(cssName) || []);
   }

   /**
    * Возвращает массив ICssEntity всех сохраненных тем по имени
    */
   getEntitiesBy(cssName: string): ICssEntity[] {
      return this.getThemeNamesFor(cssName).map((theme) => this.get(cssName, theme));
   }
}

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
function createEntityStore(): () => IStore<IEntities> {
   const store = new EntityStore();
   if (constants.isBrowserPlatform) {
      /**
       * Для случаев, когда приложение не инициализированно (unit-тесты)
       * используется локальный EntityStore
       */
      return () => store;
   }
   /**
    * на СП используется Application Store, чтобы css разных потоков не перемешивались,
    * т.к theme/controller является singleton'ом
    */
   const createDefaultStore = (): EntityStore => new EntityStore();
   setAppStore<IEntities>(EntityStore.label, createDefaultStore());
   return () => getAppStore<IEntities>(EntityStore.label, createDefaultStore);
}
