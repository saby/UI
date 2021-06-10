import * as React from 'react';
import { Logger } from 'UICommon/Utils';
import {
    CommonUtils as Common,
    RequireHelper,
    IGenerator,
    Attr,
    ConfigResolver,
    Scope,
    plainMerge,
    Helper,
    IGeneratorNameObject, ITplFunction
} from 'UICommon/Executor';
import { IWasabyEvent } from 'UICommon/Events';

import { TemplateFunction, IControlOptions } from 'UICommon/Base';
import type { TIState } from 'UICommon/interfaces';
import type { IGeneratorAttrs, TemplateOrigin, IControlConfig, TemplateResult, AttrToDecorate } from './interfaces';
import { Control } from 'UICore/Base';
import { mergeEvents } from 'UICore/Events';

export class Generator implements IGenerator {
    /**
     * В старых генераторах в этой функции была общая логика, как я понимаю.
     * Сейчас общей логики нет, поэтому функция по сути не нужна.
     * Судя по типам, все методы, которые могли вызваться из этой функции - публичные,
     * т.е. либо та логика дублировалась где-то ещё, либо типы были описаны неправильно.
     * @param type Тип элемента, определяет каким методом генератор будет его строить.
     * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
     * @param attributes Опции, заданные через attr:<имя_опции>.
     * @param events
     * @param options Опции контрола/шаблона.
     * @param config
     */
    createControlNew(
        type: 'wsControl' | 'template',
        origin: TemplateOrigin,
        attributes: Attr.IAttributes,
        events: Record<string, IWasabyEvent[]>,
        options: IControlOptions,
        config: IControlConfig
    ): React.ReactElement | React.ReactElement[] | string {
        let decorAttribs = !config.compositeAttributes
            ? attributes
            : Helper.processMergeAttributes(config.compositeAttributes, attributes);
        decorAttribs = !config.attr || config.mergeType !== 'attribute' ?
            decorAttribs :
            Helper.processMergeAttributes(config.attr.attributes, decorAttribs);

        let fullEvents = {...events};
        if (config && config.attr && config.attr.events){
            fullEvents = mergeEvents(events, config.attr.events);
        }

        const templateAttributes: IGeneratorAttrs = {
            attributes: decorAttribs,
            events: fullEvents
        };
        const parent = config.viewController;

        // вместо опций может прилететь функция, выполнение которой отдаст опции, calculateScope вычисляет такие опции
        const resolvedOptions = Scope.calculateScope(options, plainMerge);
        // если контрол создается внутри контентной опции, нужно пробросить в опции еще те, что доступны в контентной
        // опции.
        const resolvedOptionsExtended = ConfigResolver.addContentOptionScope(resolvedOptions, config);
        /*
        У шаблонов имя раньше бралось только из атрибута.
        У контролов оно бралось только из опций.
        Вряд ли есть места, где люди завязались на это поведение.
        Поэтому чтобы не костылять с проверками, просто поддержу и опции, и атрибуты для всего.
         */
        const name = attributes.name as string ?? resolvedOptionsExtended.name;

        const originRef = resolvedOptions.ref;

        const newOptions = this.calculateOptions(resolvedOptionsExtended, config, fullEvents, name, originRef);

        // @ts-ignore FIXME: Нужно положить ключ в опцию rskey для Received state. Сделать это хорошо
        newOptions.rskey = templateAttributes.attributes.key || config.key;

        const tplExtended:
            typeof Control |
            TemplateFunction |
            Common.IDefaultExport<typeof Control> |
            Function |
            ITplFunction<TemplateFunction> |
            Common.ITemplateArray =
            resolveTpl(origin, config.includedTemplates, config.depsLocal);
        let tpl: typeof Control |
            TemplateFunction |
            Function |
            ITplFunction<TemplateFunction> |
            Common.ITemplateArray;
        if (Common.isDefaultExport<typeof Control>(tplExtended)) {
            tpl = tplExtended.default;
        } else {
            tpl = tplExtended;
        }

        if (Common.isControlClass<typeof Control>(tpl)) {
            return this.processControl(
                createWsControl(tpl, newOptions, templateAttributes, config.depsLocal)
            );
        }
        // TemplateFunction - wml шаблон
        if (Common.isTemplateClass(tpl)) {
            return createTemplate(tpl, newOptions, templateAttributes, config.depsLocal, parent);
        }
        // inline template, xhtml, tmpl шаблон (closured), content option
        if (typeof tpl === 'function') {
            return resolveTemplateFunction(parent, tpl, newOptions, templateAttributes);
        }
        // content option - в определенном способе использования контентная опция может представлять собой объект
        // со свойством func, в котором и лежит функция контентной опции.
        // Демка ReactUnitTest/MarkupSpecification/resolver/Top
        if (Common.isTplFunction(tpl)) {
            return resolveTemplateFunction(parent, tpl.func, newOptions, templateAttributes);
        }

        // Common.ITemplateArray - массив шаблонов, может например прилететь,
        // если в контентной опции несколько корневых нод
        if (Common.isTemplateArray(tpl)) {
            return resolveTemplateArray(parent, tpl, newOptions, templateAttributes);
        }
        // Здесь может быть незарезолвленный контрол optional!. Поэтому результат должен быть пустым
        if (Common.isOptionalString<TemplateOrigin>(origin)) {
            return null;
        }
        // игнорируем выводимое значение null для совместимости с реализацией wasaby
        if (origin === null) {
            return null;
        }

        // не смогли зарезолвить - нужно вывести ошибку
        logResolverError(origin, parent);
        return '' + origin;
    }

    protected abstract calculateOptions(
        resolvedOptionsExtended: IControlOptions,
        config: IControlConfig,
        events: Record<string, IWasabyEvent[]>,
        name: string,
        originRef: React.MutableRefObject<Control> | React.LegacyRef<Control>): IControlOptions;

    /**
     * Дает возможность дополнительно трансформировать результат построения контрола.
     * @param control Результат построения контрола.
     */
    protected abstract processControl(
        control: React.ComponentElement<
            IControlOptions,
            Control<IControlOptions, object>
            >
    ): string | React.ComponentElement<
        IControlOptions,
        Control<IControlOptions, object>
        >;

    abstract createText(text: string): string;

    abstract createDirective(text: string): string;

    /*
    FIXME: Изначально в joinElements было return ArrayUtils.flatten(elements, true).
    Он зовётся из каждого шаблона, так что нельзя просто взять и удалить.
    Вроде он нужен для тех случаев, когда partial вернёт вложенный массив. Я пытался возвращать
    несколько корневых нод из partial, возвращался просто массив из двух элементов.
    Так что пока этот метод ничего не делает.
     */
    abstract joinElements(elements: string[] | React.ReactNode): string | React.ReactNode;

    /**
     * Строит DOM-элемент.
     * @param tagName Название DOM-элемента.
     * @param attrs Атрибуты DOM-элемента.
     * @param children Дети DOM-элемента.
     * @param attrToDecorate атрибуты элемента.
     * @param __
     * @param control Инстанс контрола-родителя, используется для заполнения _children.
     */
    abstract createTag<T extends HTMLElement, P extends React.HTMLAttributes<T>>(
        tagName: keyof React.ReactHTML,
        attrs: {
            attributes: P;
            events: Record<string, IWasabyEvent[]>
        },
        children: React.ReactNode[],
        attrToDecorate: AttrToDecorate,
        __: unknown,
        control?: Control
    ): string | React.DetailedReactHTMLElement<P, T>;

    abstract escape<T>(value: T): T;

    /**
     * подготавливает опции для контрола. вызывается в функции шаблона в случае выполнения инлайн шаблона
     * @param tplOrigin тип шаблона
     * @param scope результирующий контекст выполнения
     */
    abstract prepareDataForCreate(tplOrigin: TemplateOrigin, scope: IControlOptions): IControlOptions;
}

function getLibraryTpl(tpl: IGeneratorNameObject,
                       deps: Common.Deps<typeof Control>
): typeof Control | Common.ITemplateArray {
    let controlClass;
    if (deps && deps[tpl.library]) {
        controlClass = Common.extractLibraryModule(deps[tpl.library], tpl.module);
    } else if (RequireHelper.defined(tpl.library)) {
        controlClass = Common.extractLibraryModule(RequireHelper.extendedRequire(tpl.library, tpl.module), tpl.module);
    }
    return controlClass;
}
function resolveTpl(tpl: TemplateOrigin,
                    includedTemplates: Common.IncludedTemplates,
                    deps: Common.Deps<typeof Control>
): Common.IDefaultExport<typeof Control> | typeof Control | TemplateFunction | Common.IDefaultExport<typeof Control> |
    Function | Common.ITemplateArray | ITplFunction<TemplateFunction> {
    if (typeof tpl === 'string') {
        if (Common.isLibraryModuleString(tpl)) {
            // if this is a module string, it probably is from a dynamic partial template
            // (ws:partial template="{{someString}}"). Split library name and module name
            // here and process it in the next `if tpl.library && tpl.module`
            const tplObject = Common.splitModule(tpl);
            return getLibraryTpl(tplObject, deps);
        }
        return Common.depsTemplateResolver(tpl, includedTemplates, deps);
    }
    if (Common.isLibraryModule(tpl)) {
        return getLibraryTpl(tpl, deps);
    }
    return tpl;
}

function resolveTemplateArray(
    parent: Control<IControlOptions>,
    templateArray: Common.ITemplateArray<TemplateFunction | ITplFunction<TemplateFunction>>,
    resolvedScope: IControlOptions,
    decorAttribs: IGeneratorAttrs): TemplateResult[] {
    let result = [];
    templateArray.forEach((template: TemplateFunction | ITplFunction<TemplateFunction>) => {
        const resolvedTemplate = resolveTemplate(template, parent, resolvedScope, decorAttribs);
        if (Array.isArray(resolvedTemplate)) {
            result = result.concat(resolvedTemplate);
        } else if (resolvedTemplate) {
            result.push(resolvedTemplate);
        }
    });
    return result;
}

function resolveTemplate(template: TemplateFunction | ITplFunction<TemplateFunction>,
                         parent: Control<IControlOptions>,
                         resolvedScope: IControlOptions,
                         decorAttribs: IGeneratorAttrs): TemplateResult {
    let resolvedTemplate;
    if (typeof template === 'function') {
        resolvedTemplate = resolveTemplateFunction(parent, template, resolvedScope, decorAttribs);
    } else if (Common.isTplFunction(template)) {
        resolvedTemplate = resolveTemplateFunction(parent, template.func, resolvedScope, decorAttribs);
    } else {
        resolvedTemplate = template;
    }
    if (Array.isArray(resolvedTemplate)) {
        if (resolvedTemplate.length === 1) {
            return resolvedTemplate[0];
        }
        if (resolvedTemplate.length === 0) {
            // return null so that resolveTemplateArray does not add
            // this to the result array, since it is empty
            return null;
        }
    }
    return resolvedTemplate;
}

function resolveTemplateFunction(parent: Control<IControlOptions>,
                                 template: TemplateFunction | Function,
                                 resolvedScope: IControlOptions,
                                 decorAttribs: IGeneratorAttrs): TemplateResult {
    if (Common.isAnonymousFn(template)) {
        anonymousFnError(template, parent);
        return null;
    }
    return template.call(parent, resolvedScope, decorAttribs, undefined, true, undefined, undefined) as TemplateResult;
}
function resolveControlName(controlData: IControlOptions, attributes: Attr.IAttributes):
    Attr.IAttributes {
    const attr = attributes || {};
    if (controlData && typeof controlData.name === 'string') {
        attr.name = controlData.name;
    } else {
        if (attributes && typeof attributes.name === 'string') {
            controlData.name = attributes.name;
        }
    }
    return attr;
}

/**
 * Получает конструктор контрола по его названию и создаёт его с переданными опциями.
 * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 * @param scope Опции контрола.
 * @param decorAttribs атрибуты контрола
 * @param deps Объект с зависимостями контрола, в нём должно быть поле, соответствующее name.
 */
function createWsControl(
    origin: typeof Control,
    scope: IControlOptions,
    decorAttribs: IGeneratorAttrs,
    deps: Common.Deps<typeof Control>
): React.ComponentElement<
    IControlOptions,
    Control<IControlOptions, TIState>
> {
    resolveControlName(scope, decorAttribs.attributes);
    scope._$attributes = decorAttribs;

    return React.createElement(origin, scope);
}
/**
 * Получает шаблон по его названию и строит его.
 * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 * @param scope Опции шаблона.
 * @param attributes
 * @param deps Объект с зависимостями шаблона, в нём должно быть поле, соответствующее name.
 * @param parent Контрол, внутри которого создается данный шаблон
 */
function createTemplate(
    origin: TemplateFunction,
    scope: IControlOptions,
    attributes: IGeneratorAttrs,
    deps: Common.Deps<typeof Control>,
    parent: Control<IControlOptions>
): TemplateResult {
    /*
    Контролы берут наследуемые опции из контекста.
    Шаблоны так не могут, потому что они не полноценные реактовские компоненты.
    Поэтому берём значения либо из опций, либо из родителя.
     */
    if (typeof scope.readOnly === 'undefined') {
        scope.readOnly = parent?.props?.readOnly ?? parent?.context?.readOnly;
    }
    if (typeof scope.theme === 'undefined') {
        scope.theme = parent?.props?.theme ?? parent?.context?.theme;
    }

    return resolveTemplateFunction(parent, origin, scope, attributes);
    // Получилась ситуация, что WasabyContextManager был сам в себе, и пошли ошибки с ref
    // выписана задача - https://online.sbis.ru/opendoc.html?guid=ed465ef5-7e32-4456-94b8-14b7892150e1
    // return React.createElement(
    //     WasabyContextManager,
    //     {
    //         readOnly: scope.readOnly,
    //         theme: scope.theme
    //     },
    //     resolveTemplateFunction(parent, resultingFn, scope, attributes)
    // );
}

function logResolverError(tpl: TemplateOrigin, parent: Control<IControlOptions>): void {
    if (typeof tpl !== 'string') {
        let errorText = 'Ошибка в шаблоне! ';
        if (Common.isLibraryModule(tpl)) {
            errorText += `Контрол не найден в библиотеке.
                Библиотека: ${(tpl as IGeneratorNameObject).library}.
                Контрол: ${(tpl as IGeneratorNameObject).module}`;
        } else {
            errorText += `Неверное значение в ws:partial. Шаблон: ${tpl} имеет тип ${typeof tpl}`;
        }
        Logger.error(errorText, parent);
    }
    if (typeof tpl === 'string' && tpl.split('!')[0] === 'wml'){
        // если у нас тут осталась строка то проверим не путь ли это до шаблона
        // если это так, значит мы не смогли построить контрол, т.к. указан не существующий шаблон
        Logger.error('Ошибка при построение контрола. Проверьте существует ли шаблон ' + tpl, parent);
    }
}

function anonymousFnError(fn: TemplateFunction | Function, parent: Control<IControlOptions>): void {
    Logger.error(`Ошибка построения разметки. Была передана функция, которая не является шаблонной.
               Функция: ${fn.toString()}`, parent);
}
