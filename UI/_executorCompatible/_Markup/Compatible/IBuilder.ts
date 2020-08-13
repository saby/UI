import { _IBuilder, _IGeneratorType } from 'UI/Executor';
import {
   IOptionsCompatibleBase,
   IControlCompatible,
   IBuilderData
} from './ICompatibleType';

/**
 * @author Тэн В.А.
 */
export interface IBuilder extends _IBuilder.IBuilder {
   /**
    * Вывод ошибки в случае асинхронности в слое совместимости
    * @param result
    * @param inst
    * @returns {TObject | string}
    */
   checkAsyncResult(result: Promise<unknown> | _IGeneratorType.TObject,
                    inst: IControlCompatible): void;

   /**
    * Собираем строку script
    * @param res
    * @param optionsConfig
    * @param receivedState
    * @returns {string}
    */
   makeInlineConfigs(res: _IGeneratorType.TObject,
                     optionsConfig: string,
                     receivedState: _IGeneratorType.TObject): string;
   /**
    * Создаем сериализованное состояние
    * @param receivedState
    * @returns {string}
    */
   serializeReceivedState(receivedState: _IGeneratorType.TObject): string;

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
                              scope: _IGeneratorType.TScope,
                              attributes: _IGeneratorType.TAttributes,
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
                            scope: _IGeneratorType.IBuilderScope,
                            cnstr: Function,
                            data: IBuilderData,
                            id: unknown,
                            resultingFn: Function,
                            decOptions: _IGeneratorType.INodeAttribute | void,
                            dataComponent: string,
                            attributes: _IGeneratorType.TAttributes,
                            context: IControlCompatible | void,
                            varStorage: _IGeneratorType.TObject | void): string;
}
