/// <amd-module name='UI/theme/_controller/Store' />
import {ICssLink, THEME_TYPE } from 'UI/theme/_controller/CssLink';

const themeType = '__theme_type';

type IThemesDescripion<T> = Partial<{ [theme: string]: T; }> & { [themeType]: THEME_TYPE; };

export default class Store<T extends ICssLink = ICssLink> {
   private store: { [name: string]: IThemesDescripion<T>; } = Object.create(null);

   constructor() {
      this.set = this.set.bind(this);
      this.get = this.get.bind(this);
      this.has = this.has.bind(this);
      this.remove = this.remove.bind(this);
      this.require = this.require.bind(this);
      this.getNames = this.getNames.bind(this);
      this.getThemes = this.getThemes.bind(this);
   }

   /**
    * Добавить в Store
    */
   set(link: T): T {
      if (this.getThemes(link.name).length === 0) {
         const themesDescriptor = { [link.theme]: link };
         /**
          * Сохраняем тип темы в неперечислимом свойстве, чтобы не перепутать с именем темы theme
          */
         Object.defineProperty(themesDescriptor, themeType, { value: link.themeType });
         this.store[link.name] = <IThemesDescripion<T>> themesDescriptor;
         return link;
      }
      if (link.themeType === THEME_TYPE.SINGLE) {
         /**
          * при переключении немультитемной темы остальные темы должны удаляться,
          * т.к возникают конфликты селекторов (они одинаковые)
          */
         this.clearThemes(link.name);
      }
      this.store[link.name][link.theme] = link;
      return link;
   }

   /**
    * Проверка наличия темы `theme` у контрола `name`
    * @param name
    * @param theme
    */
   has(name: string, theme: string): boolean {
      return !Object.is(this.store[name]?.[theme], undefined);
   }

   /**
    * Получить тему `theme` для контрола `name`
    * Если темы нет в Store, выбрасывается исключение
    * @throws
    * @param name
    * @param theme
    */
   get(name: string, theme: string): T {
      if (!this.has(name, theme)) {
         throw new Error(`CssLink ${name} for ${theme} theme is not exists!`);
      }
      return this.store[name][theme];
   }

   /**
    * Увеличить 'востребованность' css,
    * т.е еще одному контролу `name` она необходима
    * @param name
    * @param theme
    */
   require(name: string, theme: string): void {
      this.get(name, theme).require();
   }

   /**
    * Уменьшить 'востребованность' css,
    * т.е контрол `name` удаляется и, если больше нет зависимостей, css также удаляется из DOM
    * @param name
    * @param theme
    */
   async remove(name: string, theme: string): Promise<boolean> {
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
    * Возвращает массив тем контролов, для которых есть css в store
    */
   getThemes(name: string): string[] {
      return Object.keys(this.store?.[name] || []);
   }

   private clearThemes(name: string): void {
      Object
         .keys(this.store[name])
         .map((theme) => this.store[name][theme])
         .forEach((link) => link.remove());
      Object
         .keys(this.store[name])
         .forEach((theme) => { delete this.store[name][theme]; });
   }
}
