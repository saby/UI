/// <amd-module name="UICore/_executor/_Expressions/Decorate" />
/* tslint:disable */
/**
 * @author Тэн В.А.
 */

import { checkAttr } from './AttrHelper';

/**
 * Создание объекта, для декорировния рутового узла
 * @param dataTemplateid
 * @param hasMarkup
 * @param componentName
 * @param addingAttributes
 * @returns {{config: *, hasmarkup: *, data-component: *}}
 */
export function createRootDecoratorObject(dataTemplateid, hasMarkup, componentName, addingAttributes) {
   var obj = { 'config': dataTemplateid, 'hasMarkup': hasMarkup , 'data-component': componentName };

   // Следует выполнять только на сервере, если вставлено два ws3 контрола на одной ноде,
   // не правильно вычислаяется data-component на клиенте
   if (typeof window === 'undefined') {
      if ('data-component' in addingAttributes) {
         obj['data-component'] = addingAttributes['data-component'];
      } else if ('attr:data-component' in addingAttributes) {
         obj['data-component'] = addingAttributes['attr:data-component'];
      }
   }

   for (var attr in addingAttributes) {
      if (attr === 'data-component' && obj.hasOwnProperty('data-component')) {
         continue;
      }
      if (addingAttributes.hasOwnProperty(attr)) {
         if (attr === 'config') {
            obj[attr] = addingAttributes[attr] + ',' + obj[attr];
         } else {
            obj[attr] = addingAttributes[attr];
         }
      }
   }

   if (typeof window !== 'undefined') {
      // We should be able to get component's config id before VDom mounting
      // The config attribute will be removed later
      var configKey = checkAttr(obj) ? 'attr:__config' : '__config';
      if (obj[configKey]) {
         // DOM element can have multiple VDOM components attached to it
         obj[configKey] += ',' + obj.config;
      } else {
         obj[configKey] = obj.config;
      }
   }

   return obj;
}
