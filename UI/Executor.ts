import RawMarkupNode from './_executor/_Expressions/RawMarkupNode';

/**
 * @author Тэн В.А.
 */

export {
   IGeneratorVNode,
   IGeneratorControlNode,
   TGeneratorNode,
   htmlNode,
   textNode,
   controlNode,
   TClosure,
   CommonUtils,
   RequireHelper,
   invisibleNodeTagName,
   ConfigResolver,
   createGenerator // fabric method
} from 'UICore/Executor';

export {
   ITemplateNode,
   _IGenerator, // только для ExecutorCompatible
   _IBuilder, // только для ExecutorCompatible
   _IGeneratorType, // только для ExecutorCompatible

   OptionsResolver // ???
} from 'UICommon/Executor';

export {
   RawMarkupNode // ???
};
