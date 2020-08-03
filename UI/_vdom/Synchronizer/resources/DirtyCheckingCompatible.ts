/// <amd-module name="UI/_vdom/Synchronizer/resources/DirtyCheckingCompatible" />
/* tslint:disable */

import { Compatible } from 'UI/Executor';
import { TClosure } from 'UI/Executor';

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
   return Compatible.createCompoundControlNode(
      controlClass_,
      controlCnstr,
      [], // вложенные v-ноды (их нет у только что созданного контрола)
      userOptions,
      internalOptions,
      key,
      parentNode,
      vnode,
      TClosure.createGenerator(false)
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
