/// <amd-module name="UI/_base/HTML/_meta/interface" />
type ISerializedMetaStack = string;
type ISerializedMetaState = string;

/**
 * Хранилище состояний meta-тегов
 */
export interface IMetaStack {
   /**
    * Добавить состояние
    * @param {IMeta} meta
    */
   push(meta: IMeta): IMetaState;
   /**
    * Удалить состояние
    * @param {IMetaState} state
    */
   remove(state: IMetaState): void;
}
export interface ISerializableMetaStack extends IMetaStack {
   serialize(): ISerializedMetaStack;
}
export type IDeserializeStack = (s: ISerializedMetaStack) => IMetaStack;

/**
 * Хранилище состояний meta-тегов представляет собой HashMap вида { id : IMetaState }
 * Для сохранения очередности при сериализации, возможности удалять промежуточные состояния
 * каждый state содержит id предыдущего и последующего MetaState
 */
interface IMetaState {
   /**
    * Сравнивает экземпляры IMetaState на равенство
    * В виде метода, т.к ссылочная целостность теряется при сериализации
    * @param state
    */
   equal(state: IMetaState): boolean;
   serialize(): ISerializedMetaState;
   setPrevState(state: IMetaState): void;
   setNextState(state: IMetaState): void;
}
export type IDeserializeMeta = (s: ISerializedMetaState) => IMetaState;

interface IMeta {
   /** Title страницы */
   title: string;
   og: Partial<IOpenGraph>;
}

interface IOpenGraph {
   url: string;
   type: string;
   title: string;
   description: string;
   image: string;
}
