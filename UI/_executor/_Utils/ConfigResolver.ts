/// <amd-module name="UI/_executor/_Utils/ConfigResolver" />

/**
 * @author Тэн В.А.
 */

import { FunctionUtils } from 'UI/Utils';
import { constants } from 'Env/Env';
import { plainMerge } from './Common';
import * as Scope from '../_Expressions/Scope';

/**
 * todo: describe method
 * @param parent
 * @param obj
 * @param currentPropertyName
 * @param data
 * @param attrs
 */
function isParentEnabled(parent: any, obj: any, currentPropertyName: any, data: any, attrs: any): boolean {
   // По умолчанию считаем enabled true
   const defaultValue = true;
   if (!constants.compat) {
      return defaultValue;
   }
   if (parent) {
      // Если известен родитель, узнаем, enabled ли он
      return !parent.isEnabled || parent.isEnabled();
   }
   if (!data) {
      return defaultValue;
   }
   if (currentPropertyName && data[currentPropertyName]) {
      // Если текущий компонент находится внутри контентной опции, проверяем, был ли задан
      // enabled или parentEnabled для нее
      if (data[currentPropertyName].enabled !== undefined) {
         return data[currentPropertyName].enabled;
      }
      if (data[currentPropertyName].parentEnabled !== undefined) {
         return data[currentPropertyName].parentEnabled;
      }
      if (attrs && attrs.internal && attrs.internal.hasOwnProperty('parentEnabled')) {
         return attrs.internal.parentEnabled;
      }
      return defaultValue;
   }
   // Если мы не внутри контентной опции, смотрим на значение enabled в scope
   if (data.enabled !== undefined) {
      return data.enabled;
   }
   if (data.parentEnabled !== undefined) {
      return data.parentEnabled;
   }
   if (attrs && attrs.internal && attrs.internal.hasOwnProperty('parentEnabled')) {
      return attrs.internal.parentEnabled;
   }
   return defaultValue;
}

var global = (function() {
   return this || (0, eval)('this');
}());
/**
 * todo: describe method
 * @param obj
 * @param currentPropertyName
 * @param data
 */
export function calcParent(obj: any, currentPropertyName: any, data: any): any {
   if (obj === global) {
      return undefined;
   }
   if (obj && obj.viewController !== undefined) {
      return obj.viewController;
   }
   return obj;
}

const mergeRegExp = /(^on:|^content$)/ig;

/**
 * todo: describe method
 * @param data
 * @param templateCfg
 * @param attrs
 */
export function resolveControlCfg(data: any, templateCfg: any, attrs: any): any {
   const internal = templateCfg.internal || { };
   let insertedData;
   let enabledFromContent;
   data = Scope.calculateScope(data, plainMerge);

   // если есть контентные данные, мы должны добавить их к существующим данным
   if (templateCfg.data && templateCfg.data[Scope.ISOLATED_SCOPE_FLAG]) {
      // на нужно пропатчить все области видимости для шаблонов, которые генерируется
      // во время создания конфига для контрола
      insertedData = templateCfg.data[templateCfg.data[Scope.ISOLATED_SCOPE_FLAG]];
      // todo удалить поддержку preventMergeOptions
      const preventMergeOptions = data && data._$preventMergeOptions;

      if (!preventMergeOptions && insertedData) {
         // Здесь не нужно прокидывать опции в старые контролы, поэтому будем прокидывать только для контента
         if (templateCfg.data[Scope.ISOLATED_SCOPE_FLAG] !== 'content') {
            delete insertedData.enabled;
         }
         if (insertedData.hasOwnProperty('enabled')) {
            enabledFromContent = insertedData.enabled;
         }
         // если в шаблон, в котором в корне лежит контрол, передали scope="{{ ... }}", в котором лежат
         // все опции старого контрола, тогда их не нужно пропускать, потому что все опции контрола переданного
         // через ... будут инициализировать контрол, который лежит внутри такого шаблона
         if (!insertedData.hasOwnProperty('parent') &&
            (!insertedData.hasOwnProperty('element') || !insertedData.element || insertedData.element.length === 0)) {

            data = FunctionUtils.merge(data, insertedData, {
               rec: !(templateCfg.viewController && templateCfg.viewController._template),

               // для vdomных детей не клонируем объекты внутрь.
               // копируем без замены свойств, потому что например может прилететь свойство content, которое
               // перетрет указанное.
               // Так например падает тест test_04_panel_move_record, при попытке перемещения записи не строится дерево,
               // потмоу что прилетает content = '' и перетирает заданный content в шаблоне
               preferSource: true,

               ignoreRegExp: mergeRegExp

               //проигнорируем events потому что они летят через атрибуты на дом элементы
               // и content, потому что content в каждой функции должен быть свой
            });
         }
      }
   }

   // вычисляем служебные опции для контрола - его физического и логического родителей,
   // видимость и активированность родителя
   internal.logicParent = templateCfg.viewController;

   if (constants.compat) {
      internal.parent = calcParent(templateCfg.ctx, templateCfg.pName, templateCfg.data);
      internal.parentEnabled = (enabledFromContent === undefined ? true : enabledFromContent)
         && isParentEnabled(
            internal.parent,
            templateCfg.ctx,
            templateCfg.pName,
            templateCfg.data,
            attrs
         );
   }
   internal.hasOldParent = attrs && attrs.internal && attrs.internal.isOldControl;

   // user - прикладные опции, internal - служебные
   return {
      user: data,
      internal
   };
}
