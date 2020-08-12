/// <amd-module name="UI/_executorCompatible/_Markup/Compatible/FabricBuildControl />
/* tslint:disable */

// @ts-ignore
import * as coreInitializer from 'Core/core-extend-initializer';
import { _ForExecutorCompatible, IBuilderScope, TObject, INodeAttribute } from 'UI/Executor';
import {
   prepareMarkupForClassCompatible,
   fixEnabledOptionCompatible,
   fixTabindexUsingAttributeCompatible,
   buildForOldControl,
   buildForSuperOldControls
} from './Helper';
import { BuildControlSSR } from './Strategy/BuildControlSSR';
import { BuildControlBrowser } from './Strategy/BuildControlBrowser';
import { IBuilder } from './IBuilder';
import {
   IControlCompatible,
   IDefaultInstanceData,
   TResultingFunction,
   IInternalCompatible,
   IOptionsCompatible
} from './ICompatibleType';
import { constants } from "Env/Env";

const Common = _ForExecutorCompatible.Common;
const ResolveControlName = _ForExecutorCompatible.ResolveControlName;

/**
 * @author Тэн В.А.
 */
// @ts-ignore
export class FabricBuildControl implements IBuilder {
   static create(cnstr: Function,
                 scope: IBuilderScope,
                 context: IControlCompatible,
                 varStorage: TObject,
                 decOptions: INodeAttribute): string {
      const callback = prepareMarkupForClassCompatible(cnstr, scope, context, decOptions);
      const resultingFn = callback.resultingFn;
      const _options = callback._options;
      const defaultInstanceData = callback.defaultInstanceData;
      const result = '';
      scope = callback.scope;

      return this.buildMarkupForClassCompatible(
         cnstr,
         _options,
         scope,
         context,
         varStorage,
         decOptions,
         resultingFn,
         defaultInstanceData,
         result);
   }

   private static getBuildForNewControl() {
      if (constants.isServerSide && typeof process !== 'undefined') {
         return new BuildControlSSR();
      }
      return new BuildControlBrowser();
   }

   /**
    * Подготавливает объект для создания контрола
    * на данном этапе решаем какой это контрол (новый, старый, очень старый)
    * @returns {string}
    * @param cnstr
    * @param _options
    * @param scope
    * @param context
    * @param varStorage
    * @param decOptions
    * @param resultingFn
    * @param defaultInstanceData
    * @param result
    */
   private static buildMarkupForClassCompatible(
      cnstr: Function,
      _options: IOptionsCompatible,
      scope: IBuilderScope,
      context: IControlCompatible,
      varStorage: TObject,
      decOptions: INodeAttribute,
      resultingFn: TResultingFunction,
      defaultInstanceData: IDefaultInstanceData,
      result: string): string {
      if (Common.isNewControl(cnstr) || resultingFn.stable) {

         /**
          * После этого шага опции сохранены в конфиг, а это значит, что мы можем положить enabled здесь
          */
         const fix = fixEnabledOptionCompatible(_options, <IInternalCompatible> scope.internal, defaultInstanceData);

         const options = defaultInstanceData ?
            coreInitializer.getInstanceOptionsByDefaults(cnstr, _options, defaultInstanceData) : _options;
         decOptions = <INodeAttribute> ResolveControlName.resolveControlName(options, decOptions);
         if (Common.isNewControl(cnstr)) {//Новые контролы
            const builder = this.getBuildForNewControl();
            result = builder.buildForNewControl({
               user: options,
               internal: scope.internal,
               templateContext: scope.templateContext,
               inheritOptions: scope.inheritOptions,
               key: scope.key
            }, cnstr, decOptions);
         } else {//Старые контролы
            const tabNeedMerge = fixTabindexUsingAttributeCompatible(decOptions, options);
            result = buildForOldControl({ user: options, internal: scope.internal },
               cnstr,
               resultingFn,
               decOptions,
               _options);
            if (!tabNeedMerge) {
               delete options.tabindex;
            }
         }

         if (fix) {
            /**
             * Если в опции добавляли enabled, нужно его удалить.
             * Чтобы он не прилетел в конфиг
             */
            delete _options.enabled;
         }
         //уберём временные поля, добавленные для построения вёрстки
         if (cnstr.prototype._modifyOptionsAfter) {
            cnstr.prototype._modifyOptionsAfter(scope.user);
         }
         return result;
      } else {//Супер-старые контролы
         // remove focus attributes from object
         // ! не вырезаем фокусные атрибуты, для совместимости. чтобы старые компоненты могли работать в новом окружении
         // textMarkupGenerator.cutFocusAttributes(decOptions);

         decOptions = <INodeAttribute> ResolveControlName.resolveControlName(_options, decOptions);
         fixTabindexUsingAttributeCompatible(decOptions, _options);
         result = buildForSuperOldControls({ user: _options, internal: scope.internal },
            cnstr,
            context,
            varStorage,
            decOptions);
      }
      return result;
   }
}
