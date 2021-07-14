export { IGeneratorVNode, IGeneratorControlNode, TGeneratorNode } from './_executor/_Markup/Vdom/IVdomType';
export * as TClosure from './_executor/TClosure';
export { createGenerator } from './_executor/TClosure';
export {
    htmlNode,
    textNode,
    portalTagName,
    controlNode
} from './_executor/_Utils/Vdom';

/**
 * для совместимого генератора
 */
export * as Decorate from './_executor/_Expressions/Decorate';
export * as MarkupUtils from './_executor/_Markup/Utils';
export { ResolveControlName } from './_executor/_Markup/ResolveControlName';
export { Generator as GeneratorBase } from './_executor/_Markup/Generator';
