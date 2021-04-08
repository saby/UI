/// <amd-module name="UICommon/_executor/_Markup/IBuilder" />
/* tslint:disable */

import { IBuilderScope, TObject, TAttributes } from './IGeneratorType';

/**
 * @author Тэн В.А.
 */
export interface IBuilder {
   /**
    * Создаем контрол
    * @param cnstr
    * @param scope
    * @param decOptions
    * @returns {TObject | string}
    */
   buildForNewControl(scope: IBuilderScope,
                      cnstr: Function,
                      decOptions: TAttributes): TObject | string;
}
