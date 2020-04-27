/// <amd-module name="UI/_base/HTML/_meta/interface" />
export type ISerializedMetaStack = string;
export type ISerializedMetaState = string;

/**
 * Хранилище состояний meta-тегов
 * @interface IMetaStack
 * @public
 */
export interface IMetaStack {
   /**
    * Добавить состояние
    * @param {IMeta} meta
    * @returns {IMetaState}
    * @example
    * import { getMetaStack } from 'UI/Base';
    * const meta: IMeta = { title: 'Page title' }
    * const state: IMetaState = getMetaStack().push(meta);
    */
   push(meta: IMeta): IMetaState;
   /**
    * Удалить состояние
    * @param {IMetaState} state
    * @example
    * import { getMetaStack } from 'UI/Base';
    * const meta: IMeta = { title: 'Page title' }
    * const stack: IMetaStack = getMetaStack();
    * const state: IMetaState = stack.push(meta);
    *  ...
    * stack.remove(state);
    */
   remove(state: IMetaState): void;
}
export interface IMetaStackInternal extends IMetaStack {
   lastState: IMetaStateInternal;
   /**
    * Сериализация stack'a
    * @returns {ISerializedMetaStack}
    * @private
    */
   serialize(): ISerializedMetaStack;
}
export type IDeserializeStack = (s: ISerializedMetaStack) => IMetaStackInternal;

/**
 * Состояние meta-тегов
 * @interface IMetaState
 * @public
 */
export interface IMetaState {
   /**
    * Возвращает уникальный guid состояния
    * @public
    * @method
    */
   getId(): string;
   /**
    * Сравнивает экземпляры IMetaState на равенство
    * В виде метода, т.к ссылочная целостность теряется при сериализации
    * @public
    * @method
    * @param {IMetaState} state
    * @returns {boolean}
    */
   equal(state: IMetaState): boolean;
}
export interface IMetaStateInternal extends IMetaState {
   /** HTML-разметка title и og-тегов */
   outerHTML: string;
   /**
    * Сериализация состояния
    * @returns {ISerializedMetaState}
    * @private
    * @example
    * const state = new State(meta);
    * deserializeState(state.serialize()).equal(state)) === true;
    */
   serialize(): ISerializedMetaState;
   /**
    * Возвращает мета-данные состояния
    * @private
    */
   getMeta(): IMeta;

   getPrevStateId(): string;
   setPrevState(state: IMetaState): void;

   getNextStateId(): string;
   setNextState(state: IMetaState): void;
}
export type IDeserializeMeta = (s: ISerializedMetaState) => IMetaStateInternal;

/**
 * @typedef IMeta
 * @property {string} title Title страницы
 * @property {IOpenGraph} [og] OpenGraph тэги страницы
 * @interface IMeta
 */
export interface IMeta {
   /** Title страницы */
   title: string;
   og?: Partial<IOpenGraph>;
}
/**
 * @typedef IOpenGraph
 * @property {string} description
 * @property {string} title
 * @property {string} image
 * @property {string} type
 * @property {string} url
 * @interface IOpenGraph
 */
export interface IOpenGraph {
   description: string;
   title: string;
   image: string;
   type: string;
   url: string;
}
