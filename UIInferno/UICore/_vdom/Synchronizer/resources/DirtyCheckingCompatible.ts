/// <amd-module name="UICore/_vdom/Synchronizer/resources/DirtyCheckingCompatible" />
/* tslint:disable */

import { TClosure } from 'UICore/Executor';
import { Logger } from 'UICore/Utils';
import {_FocusAttrs} from 'UICore/Focus';

let compatibleUtils;
export function getCompatibleUtils() {
   if (requirejs.defined('View/ExecutorCompatible')) {
      compatibleUtils = requirejs('View/ExecutorCompatible').CompatibleUtils;
   } else {
      Logger.error('View/ExecutorCompatible не загружен. Проверьте загрузку слоя совместимости');
   }
   return compatibleUtils;
}

/**
 * @author Кондаков Р.Н.
 */
export function createCompoundControlNode(
   controlClass_,
   controlCnstr,
   userOptions,
   internalOptions,
   key,
   parentNode,
   vnode
) {
   return getCompatibleUtils().createCompoundControlNode(
      controlClass_,
      controlCnstr,
      [], // вложенные v-ноды (их нет у только что созданного контрола)
      userOptions,
      internalOptions,
      key,
      parentNode,
      vnode,
      TClosure.createGenerator(false, undefined, {
         prepareAttrsForPartial: function prepareAttrsForPartial(attributes) {
            return _FocusAttrs.prepareAttrsForFocus(attributes.attributes);
         }
      })
   );
}
export function clearNotChangedOptions(options, actualChanges) {
   if (options) {
      delete options.editingTemplate;
      delete options.columns;
      delete options.itemContentTpl;
      delete options.dictionaries;
   }

   // If option is marked as updated, but its value didn't actually change, remove
   // it from the list of updated options
   for (var key in options) {
      if (options.hasOwnProperty(key) && !actualChanges.hasOwnProperty(key)) {
         delete options[key];
      }
   }

   return options;
}
