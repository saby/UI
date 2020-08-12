import { createGenerator } from './_executor/TClosure';
import * as TClosure from './_executor/TClosure';
import { htmlNode, textNode } from './_executor/_Utils/Vdom';
import * as Compatible from './_executor/_Utils/Compatible';
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
import {
   IBuilderScope,
   IControl,
   IControlData,
   IControlProperties,
   ICreateControlTemplateCfg,
   IGeneratorAttrs,
   IGeneratorConfig,
   IGeneratorDefCollection,
   IGeneratorInternalProperties,
   INodeAttribute,
   GeneratorFn,
   GeneratorObject,
   GeneratorEmptyObject,
   GeneratorTemplateOrigin,
   TAttributes,
   TDeps,
   TIncludedTemplate,
   TObject,
   TOptions,
   TScope
} from './_executor/_Markup/IGeneratorType';
import { IGenerator } from './_executor/_Markup/IGenerator';
import { IBuilder } from './_executor/_Markup/IBuilder';

export {
   htmlNode,
   textNode,
   TClosure,
   createGenerator, // fabric method

   Compatible, // ???
   OptionsResolver, // ???
   RawMarkupNode, // ???

   // TODO: для работы executorCompatible
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
   voidElements,
   IBuilderScope,
   IControl,
   IControlData,
   IControlProperties,
   ICreateControlTemplateCfg,
   IGeneratorAttrs,
   IGeneratorConfig,
   IGeneratorDefCollection,
   IGeneratorInternalProperties,
   INodeAttribute,
   GeneratorFn,
   GeneratorObject,
   GeneratorEmptyObject,
   GeneratorTemplateOrigin,
   TAttributes,
   TDeps,
   TIncludedTemplate,
   TObject,
   TOptions,
   TScope,
   IGenerator,
   IBuilder
};
