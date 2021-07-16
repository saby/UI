import { getIfNeedGeneratorCompatible } from 'UICommon/Executor';
import { Text, Vdom } from './Markup';
import { Logger } from 'UICommon/Utils';
import { Fragment, createElement } from 'react';

export function createGenerator(isVdom, forceCompatible = false, config) {
   if (isVdom) {
      return Vdom(config);
   }

   const Compatible = getIfNeedGeneratorCompatible(forceCompatible, config);
   if (Compatible) {
      return Compatible;
   }

   return Text(config);
}

export function createDataArrayReact(array, templateName, isWasabyTemplate) {
   let result;
   if (array.length === 1) {
      result = array[0];
   } else {
      result = (props) => createElement(Fragment, {
         children: array.map((child) => child(props))
      });
   }
   Object.defineProperty(result, 'isDataArray', {
      value: true,
      configurable: true,
      enumerable: false,
      writable: true
   });
   Object.defineProperty(result, 'isWasabyTemplate', {
      value: !!isWasabyTemplate,
      configurable: true,
      enumerable: false,
      writable: true
   });
   Object.defineProperty(result, 'toString', {
      value(): string {
         Logger.templateError(
             'Использование контентной опции компонента или шаблона в качестве строки. ' +
             'Необходимо использовать контентные опции с помощью конструкции ws:partial или ' +
             'обратитесь в отдел Инфраструктура представления', templateName);
         return this.join('');
      },
      configurable: true,
      enumerable: false,
      writable: true
   });

   return result;
}

export function createForwardRef(callback: Function): any {
   // TODO: forwardRef для react
   return callback;
}

export {
   isolateScope,
   createScope,
   presetScope,
   uniteScope,
   createDataArray,
   filterOptions,
   calcParent,
   wrapUndef,
   getDecorators,
   Sanitize,
   iterators,
   templateError,
   partialError,
   makeFunctionSerializable,
   getter,
   setter,
   config,
   processMergeAttributes,
   plainMerge,
   plainMergeAttr,
   plainMergeContext,
   getTypeFunc,
   validateNodeKey,
   getRk,
   getContext,
   _isTClosure
} from 'UICommon/Executor';
