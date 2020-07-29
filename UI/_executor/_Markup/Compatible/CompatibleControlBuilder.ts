/// <amd-module name="UI/_executor/_Markup/Compatible/CompatibleControlBuilder" />
/* tslint:disable */

// @ts-ignore
import * as randomId from 'Core/helpers/Number/randomId';
// @ts-ignore
import * as ParserUtilities from 'Core/markup/ParserUtilities';
import { Logger } from 'UI/Utils';
import { _FocusAttrs } from 'UI/Focus';
import * as Decorate from '../../_Expressions/Decorate';
import * as Rights from '../../_Expressions/Rights';
import * as Common from '../../_Utils/Common';
import { fillNonExistentValues, generateIdWithParent, hasMarkupConfig } from './Helper';
import { ResolveControlName } from '../ResolveControlName';
import { IBuilder } from './IBuilder';
import { FabricBuildControl } from './FabricBuildControl';

/**
 * @author Тэн В.А.
 */
// @ts-ignore
export class CompatibleControlBuilder implements IBuilder {
   createCompatibleController(tpl, scope, attributes, context, _deps, data) {

      const point = '[UI/_executor/_Markup/SuperDuperBuilder:createCompatibleController()]';
      Logger.debug(`${point} dataComponent - "${data.dataComponent}"`, data.controlProperties);

      let id = randomId('cfg-');
      const cnstr = data.controlClass;
      const varStorage = null;
      let decOptions;

      const controlData = data.controlProperties;

      if (!controlData['data-component']) {
         controlData['data-component'] = data.dataComponent;
         data.attrs['data-component'] = data.dataComponent;
      }

      // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
      _FocusAttrs.resetDefaultValues(data.attrs);
      _FocusAttrs.prepareTabindex(data.attrs);
      // remove focus attributes from object
      // ! не вырезаем фокусные атрибуты, для совместимости. чтобы старые компоненты могли работать в новом окружении
      // textMarkupGenerator.cutFocusAttributes(data.attrs);

      /*__dirtyCheckingVars_ - это переменные из внутренних шаблонов. И если там был старый биндинг, то это надо удалить,
      * __dirtyCheckingVars_ должны работать только в vdom*/
      for (let di = 0; controlData.hasOwnProperty("__dirtyCheckingVars_" + di); di++) {
         delete controlData["__dirtyCheckingVars_" + di];
      }
      if (controlData && controlData.bindings) {
         for (let i = 0; i < controlData.bindings.length; i++) {
            if (controlData.bindings[i].propName && controlData.bindings[i].propName.indexOf("__dirtyCheckingVars_") > -1) {
               controlData.bindings.splice(i, 1);
               i--;
            }
         }
      }
      fillNonExistentValues(controlData);
      // нужно чтобы name устанавливался из данных, если он там есть
      attributes = ResolveControlName.resolveControlName(controlData, data.attrs);
      if (Rights.applyRights(attributes, controlData)) {
         decOptions = Decorate.createRootDecoratorObject(id, 'false', data.dataComponent, attributes);
         return ParserUtilities.buildMarkupForClass(cnstr, controlData, context, varStorage, undefined, undefined, decOptions);
      } else {
         return '';
      }
   };

   buildWsControlCompatible(_options, scope, cnstr, data, id, resultingFn, decOptions, dataComponent, attributes, context, varStorage) {
      if (_options && _options.bindings) {
         for (let i = 0; i < _options.bindings.length; i++) {
            if (_options.bindings[i].propName && _options.bindings[i].propName.indexOf("__dirtyCheckingVars_") > -1) {
               _options.bindings.splice(i, 1);
               i--;
            }
         }
      }
      fillNonExistentValues(_options);
      scope.internal = scope.internal || {};

      if (Common.isCompat() || !Common.isNewControl(cnstr) || !data.logicParent || !data.logicParent._template) {
         /*Для слоя совместимости продолжим генерировать ID в противном случае просто подкидываем cfg-123, чтобы не падали юниты*/
         id = generateIdWithParent();
      } else {
         id = 'cfg-123';
      }
      if (Common.isNewControl(cnstr) && data.logicParent && data.logicParent._template || Rights.applyRights(data.attrs, _options)) {
         if (resultingFn) {
            decOptions = Decorate.createRootDecoratorObject(id, hasMarkupConfig(_options, !resultingFn.stable),
               dataComponent, data.attrs);
         } else {
            decOptions = data.attrs;
            delete decOptions['data-component'];
            delete _options['data-component'];
         }
         _options['__$config'] = id;
         if (data.attrs && data.attrs.__wasOldControl) {

            Object.defineProperty(decOptions, '__wasOldControl', {
               value: true,
               enumerable: false,
               configurable: false
            });
         }
         // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
         _FocusAttrs.resetDefaultValues(decOptions);
         return FabricBuildControl.create(cnstr, {
            user: _options,
            internal: data.internal,
            templateContext: attributes.context,
            inheritOptions: attributes.inheritOptions,
            key: attributes.key
         }, context, varStorage, decOptions);
      }
      return '';
   };
}

