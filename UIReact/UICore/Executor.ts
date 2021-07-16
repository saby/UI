export * as TClosure from './_executor/TClosure';
export { createGenerator } from './_executor/TClosure';
export {
    htmlNode,
    textNode,
    controlNode
} from './_executor/_Utils/Vdom';

/**
 * для совместимого генератора
 */
 export {
    Generator as GeneratorBase,
    resolveTpl,
    resolveTemplateFunction,
    resolveTemplateArray,
    logResolverError,
    resolveControlName
} from './_executor/_Markup/Generator';
export * as MarkupUtils from './_executor/_Markup/Utils';
export {
    IGeneratorAttrs,
    TemplateOrigin,
    IControlConfig,
    TemplateResult,
    AttrToDecorate
} from './_executor/_Markup/interfaces';
