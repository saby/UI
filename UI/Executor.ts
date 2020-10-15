import { createGenerator } from './_executor/TClosure';
import * as TClosure from './_executor/TClosure';
import { htmlNode, textNode } from './_executor/_Utils/Vdom';
import * as OptionsResolver from './_executor/_Utils/OptionsResolver';
import RawMarkupNode from './_executor/_Expressions/RawMarkupNode';

import * as _IGenerator from './_executor/_Markup/IGenerator';
import * as _IGeneratorType from './_executor/_Markup/IGeneratorType';
export { ITemplateNode, TGeneratorNode } from './_executor/_Markup/IGeneratorType';
import * as _IBuilder from './_executor/_Markup/IBuilder';

// TODO: для работы executorCompatible
import * as _ForExecutorCompatible from './_executor/ForExecutorCompatible';

/**
 * @author Тэн В.А.
 */

export {
   htmlNode,
   textNode,
   TClosure,
   createGenerator, // fabric method
   _ForExecutorCompatible,  // только для ExecutorCompatible
   _IGenerator, // только для ExecutorCompatible
   _IGeneratorType, // только для ExecutorCompatible
   _IBuilder, // только для ExecutorCompatible

   OptionsResolver, // ???
   RawMarkupNode // ???
};
