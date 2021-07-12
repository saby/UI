import { getIfNeedGeneratorCompatible, IGenerator } from 'UICommon/Executor';
import { Text, Vdom } from './Markup';

export function createGenerator(isVdom, forceCompatible = false, config): IGenerator {
   if (isVdom) {
      return Vdom(config);
   }
   const Compatible = getIfNeedGeneratorCompatible(forceCompatible, config);
   if (Compatible) {
      return Compatible;
   }

   return Text(config);
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
