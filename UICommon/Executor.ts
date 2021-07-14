export * as Attr from './_executor/_Expressions/Attr';
export { processMergeAttributes } from './_executor/_Expressions/Attr';
export { IAttributes } from './_executor/_Expressions/Attr';
export * as AttrHelper from './_executor/_Expressions/AttrHelper';
export * as Scope from './_executor/_Expressions/Scope';

export * as OptionsResolver from './_executor/_Utils/OptionsResolver';

export { IGenerator } from './_executor/_Markup/IGenerator';
export * as _IGenerator from './_executor/_Markup/IGenerator';
export * as _IBuilder from './_executor/_Markup/IBuilder';
export * as Helper from './_executor/_Markup/Helper';


export {
    Common as CommonUtils,
    RequireHelper,
    invisibleNodeTagName,
    VoidTags,
    ConfigResolver,
    Class
} from './_executor/Utils';

export { onElementMount, onElementUnmount } from './_executor/_Utils/ChildrenManager';

export { pauseReactive, setPauseReactive } from './_executor/pauseReactive';

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
    plainMerge,
    plainMergeAttr,
    plainMergeContext,
    getTypeFunc,
    validateNodeKey,
    getRk,
    getContext,
    getIfNeedGeneratorCompatible,
    _isTClosure
 } from './_executor/TClosure';
