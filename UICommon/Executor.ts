export * as Attr from './_executor/_Expressions/Attr';
export { processMergeAttributes } from './_executor/_Expressions/Attr';
export { IAttributes } from './_executor/_Expressions/Attr';
export * as AttrHelper from './_executor/_Expressions/AttrHelper';

export * as OptionsResolver from './_executor/_Utils/OptionsResolver';

export { htmlNode, textNode, controlNode } from './_executor/_Utils/Vdom';
export {
    Common as CommonUtils,
    Vdom,
    RequireHelper,
    invisibleNodeTagName,
    ConfigResolver
} from './_executor/Utils';

// TODO: для работы executorCompatible
export * as _ForExecutorCompatible from './_executor/ForExecutorCompatible';
export * as Scope from './_executor/_Expressions/Scope';
export {
    invisibleNodeCompat,
    isInstOfPromise,
    asyncRenderErrorTag,
    createTagDefault,
    joinElements,
    cutFocusAttributes,
    stringTemplateResolver
} from './_executor/_Markup/Utils';
export { ResolveControlName } from './_executor/_Markup/ResolveControlName';
export { Generator } from './_executor/_Markup/Generator';

export * as _IGeneratorType from './_executor/_Markup/IGeneratorType';
export {
    IGeneratorConstructor,
    IGeneratorInternalProperties,
    IGeneratorDefCollection,
    IBaseAttrs,
    IGeneratorAttrsContext,
    IGeneratorNameObject,
    IGeneratorControlName,
    IGeneratorAttrs,
    IGeneratorInheritOptions,
    IGeneratorConfig,
    IConfigBase,
    IConfigCalculator,
    IConfigIterator,
    ICreateControlTemplateCfg,
    IControlData,
    IControlUserData,
    IPrepareDataForCreate,
    IControlProperties,
    IControl,
    IControlContext,
    IPrepareDataForCreateAttrs,
    IBuilderScope,
    ITplFunction,
    INodeAttribute,
    WsControlOrController,
    GeneratorFn,
    GeneratorVoid,
    GeneratorError,
    GeneratorObject,
    GeneratorEmptyObject,
    GeneratorStringArray,
    GeneratorTemplateOrigin,
    TObject,
    TOptions,
    TScope,
    TDeps,
    TIncludedTemplate,
    TAttributes,
    TEvents,
    IControlConfig,
    TProps,
    ITemplateNode
} from './_executor/_Markup/IGeneratorType';
