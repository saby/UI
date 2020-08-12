import { createGenerator } from './_executor/TClosure';
import * as TClosure from './_executor/TClosure';
import { htmlNode, textNode } from './_executor/_Utils/Vdom';
import * as OptionsResolver from './_executor/_Utils/OptionsResolver';
import RawMarkupNode from './_executor/_Expressions/RawMarkupNode';

// TODO: для работы executorCompatible
import * as Decorate from './_executor/_Expressions/Decorate';
import * as Rights from './_executor/_Expressions/Rights';
import * as Common from './_executor/_Utils/Common';
import { ResolveControlName } from './_executor/_Markup/ResolveControlName';
import { Generator } from './_executor/_Markup/Generator';
import * as RequireHelper from './_executor/_Utils/RequireHelper';
import * as Scope from './_executor/_Expressions/Scope';
import * as MarkupUtils from './_executor/_Markup/Utils';
import * as Attr from './_executor/_Expressions/Attr';
import * as Class from './_executor/_Utils/Class';
import voidElements from './_executor/_Utils/VoidTags';
import * as _IGenerator from './_executor/_Markup/IGenerator';
import * as _IGeneratorType from './_executor/_Markup/IGeneratorType';
import * as _IBuilder from './_executor/_Markup/IBuilder';

const _ForExecutorCompatible = {
   Decorate,
   Rights,
   Common,
   ResolveControlName,
   Generator,
   RequireHelper,
   Scope,
   MarkupUtils,
   Attr,
   Class,
   voidElements
};

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
