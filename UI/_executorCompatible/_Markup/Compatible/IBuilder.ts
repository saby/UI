import { IBuilder as IBuilderExtend } from 'UI/_executor/_Markup/IBuilder';
import { TObject, TScope, TAttributes, IBuilderScope, INodeAttribute } from 'UI/_executor/_Markup/IGeneratorType';
import {
   IOptionsCompatibleBase,
   IControlCompatible,
   IBuilderData
} from './ICompatibleType';

/**
 * @author Тэн В.А.
 */
export interface IBuilder extends IBuilderExtend {
   /**
    * Вывод ошибки в случае асинхронности в слое совместимости
    * @param result
    * @param inst
    * @returns {TObject | string}
    */
   checkAsyncResult(result: Promise<unknown> | TObject,
                    inst: IControlCompatible): void;

   /**
    * Собираем строку script
    * @param res
    * @param optionsConfig
    * @param receivedState
    * @returns {string}
    */
   makeInlineConfigs(res: TObject,
                     optionsConfig: string,
                     receivedState: TObject): string;
   /**
    * Создаем сериализованное состояние
    * @param receivedState
    * @returns {string}
    */
   serializeReceivedState(receivedState: TObject): string;

   /**
    * Создаем совместимый контрол без шаблона
    * @param tpl
    * @param scope
    * @param attributes
    * @param context
    * @param _deps
    * @param data
    * @returns {string}
    */
   createCompatibleController(tpl: Function,
                              scope: TScope,
                              attributes: TAttributes,
                              context: IControlCompatible | void,
                              _deps: unknown,
                              data: IBuilderData): string;
   /**
    * Создаем совместимный контрол
    * @param _options
    * @param scope
    * @param cnstr
    * @param id
    * @param resultingFn
    * @param decOptions
    * @param dataComponent
    * @param attributes
    * @param context
    * @param data
    * @param varStorage
    * @returns {string}
    */
   buildWsControlCompatible(_options: IOptionsCompatibleBase,
                            scope: IBuilderScope,
                            cnstr: Function,
                            data: IBuilderData,
                            id: unknown,
                            resultingFn: Function,
                            decOptions: INodeAttribute | void,
                            dataComponent: string,
                            attributes: TAttributes,
                            context: IControlCompatible | void,
                            varStorage: TObject | void): string;
}
