export * as _IGenerator from './_executor/_Markup/IGenerator';
export * as _IGeneratorType from './_executor/_Markup/IGeneratorType';
export * as _IBuilder from './_executor/_Markup/IBuilder';
export { ITemplateNode } from './_executor/_Markup/IGeneratorType';
export { IGeneratorVNode, IGeneratorControlNode, TGeneratorNode } from './_executor/_Markup/Vdom/IVdomType';
export { htmlNode, textNode, controlNode } from './_executor/_Utils/Vdom';
export * as TClosure from './_executor/TClosure';
export { createGenerator } from './_executor/TClosure';
export {
    Common as CommonUtils,
    RequireHelper,
    OptionsResolver,
    invisibleNodeTagName,
    ConfigResolver
} from './_executor/Utils';

// TODO: для работы executorCompatible
export * as _ForExecutorCompatible from './_executor/ForExecutorCompatible';

export { onElementMount, onElementUnmount } from './_executor/_Utils/ChildrenManager';
