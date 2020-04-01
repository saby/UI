/// <amd-module name="UI/_base/HTML/_meta/interface" />
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
/**
 * Хранилище состояний meta-тегов представляет собой HashMap вида { id : IMetaState }
 * Для сохранения очередности при сериализации, возможности удалять промежуточные состояния
 * каждый state содержит id предыдущего и последующего state
 */
interface IMetaState {
   /** Уникальный id состояния */
   readonly id: string;
   setPrevState(state: IMetaState): void;
   setNextState(state: IMetaState): void;
}

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
