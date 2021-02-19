import { composeWithResultApply } from 'UI/_vdom/Utils/Functional';
import { IControlNode, IDOMEnvironment, IAttrs } from 'UI/_vdom/Synchronizer/interfaces';
import { textNode, OptionsResolver } from 'UI/Executor';
import { Logger, needToBeCompatible } from 'UI/Utils';
import { createCompoundControlNode, getCompatibleUtils } from 'UI/_vdom/Synchronizer/resources/DirtyCheckingCompatible';
import { collectObjectVersions } from 'UI/_vdom/Synchronizer/resources/Options';
/**
 * @author Кондаков Р.Н.
 */
/**
 * Добавляет родителя во внутренние опции компонента, если он отсутствует
 * @param internalOptions
 * @param userOptions
 * @param parentNode
 */
function fixInternalParentOptions(internalOptions: IAttrs, userOptions: IAttrs, parentNode) {
    // У compound-контрола parent может уже лежать в user-опциях, берем его оттуда, если нет нашей parentNode
    internalOptions.parent = internalOptions.parent || (parentNode && parentNode.control) || userOptions.parent || null;
    internalOptions.logicParent =
        internalOptions.logicParent ||
        (parentNode && parentNode.control && parentNode.control.logicParent) ||
        userOptions.logicParent ||
        null;
}

function getModuleDefaultCtor(mod) {
    return typeof mod === 'function' ? mod : mod['constructor'];
}

const ARR_EMPTY = [];

function getControlNodeParams(control, controlClass, environment) {
    var composedDecorator = composeWithResultApply.call(undefined, [environment.getMarkupNodeDecorator()]).bind(control);
    return {
        markupDecorator: composedDecorator,
        defaultOptions: {} //нет больше понятия опция по умолчанию
    };
}

function getActualOptions(cnstr, userOptions, internalOptions) {
    return userOptions;
}

function createInstanceCallback(inst, actualOptions, internalOptions) {
}
interface INodeOptions {
    /**
     * Прикладные опции
     */
    user: IAttrs;
    /**
     * Служебные опции
     */
    internal: IAttrs;
    /**
     * Нативные аттрибуты
     */
    attributes: IAttrs;
    events: Record<string, () => void>;
}

function shallowMerge(dest, src) {
    var i;
    for (i in src) {
        if (src.hasOwnProperty(i)) {
            dest[i] = src[i];
        }
    }
    return dest;
}

export function createNode(controlClass_, options: INodeOptions, key: string, environment: IDOMEnvironment, parentNode, serialized, vnode?): IControlNode {
    let controlCnstr = getModuleDefaultCtor(controlClass_); // получаем конструктор из модуля
    let compound = vnode && vnode.compound;
    let serializedState = (serialized && serialized.state) || { vdomCORE: true }; // сериализованное состояние компонента
    let userOptions = options.user;
    let internalOptions = options.internal;
    let result;

    fixInternalParentOptions(internalOptions, userOptions, parentNode);

    if (!key) {
        /*У каждой ноды должен быть ключ
         * for строит внутренние ноды относительно этого ключа
         * */
        key = '_';
    }

    if (compound) {
        if (parentNode.control._moduleName !== "Core/CompoundContainer") {
            Logger.error(`В wasaby-окружении неправильно создается ws3-контрол. Необходимо использовать Core/CompoundContainer, а не вставлять ws3-контрол в шаблон wasaby-контрола напрямую.
         Подробнее тут https://wi.sbis.ru/doc/platform/developmentapl/ws3/compound-wasaby/
         Вставляется контрол '${controlCnstr && controlCnstr.prototype && controlCnstr.prototype._moduleName}' в шаблоне контрола `,
                internalOptions && internalOptions.logicParent);
        } else {
            // Создаем виртуальную ноду для compound контрола
            result = createCompoundControlNode(
                controlClass_,
                controlCnstr,
                userOptions,
                internalOptions,
                key,
                parentNode,
                vnode
            );
        }
    } else {
        // Создаем виртуальную ноду для не-compound контрола
        let invisible = vnode && vnode.invisible;
        // подмешиваем сериализованное состояние к прикладным опциям
        let optionsWithState = serializedState ? shallowMerge(userOptions, serializedState) : userOptions;
        let optionsVersions;
        let internalVersions;
        let contextVersions;
        let control;
        let params;
        let context;
        let inst;
        let defaultOptions;

        if (typeof controlClass_ === 'function') {
            let configForCreateInstance;
            if (needToBeCompatible(controlCnstr, internalOptions.parent, internalOptions.iWantBeWS3)) {
                configForCreateInstance = {
                    getActualOptions: getCompatibleUtils().getActualOptions,
                    createInstanceCallback: getCompatibleUtils().createInstanceCallback
                };
            } else {
                configForCreateInstance = {
                    getActualOptions,
                    createInstanceCallback
                }
            }
            inst = createInstance(controlCnstr, optionsWithState, internalOptions, configForCreateInstance);

            control = inst.instance;
            optionsWithState = inst.resolvedOptions;
            defaultOptions = inst.defaultOptions;
        } else {
            // инстанс уже есть, работаем с его опциями
            control = controlClass_;
            defaultOptions = OptionsResolver.getDefaultOptions(controlClass_);
            if (needToBeCompatible(controlCnstr, internalOptions.parent, internalOptions.iWantBeWS3)) {
                optionsWithState = getCompatibleUtils().combineOptionsIfCompatible(
                    controlCnstr,
                    optionsWithState,
                    internalOptions
                );
                if (control._setInternalOptions) {
                    control._options.doNotSetParent = true;
                    control._setInternalOptions(internalOptions || {});
                }
            }
        }

        // check current options versions
        optionsVersions = collectObjectVersions(optionsWithState);
        // check current context field versions
        context = (vnode && vnode.context) || {};
        contextVersions = collectObjectVersions(context);
        internalVersions = collectObjectVersions(internalOptions);

        params = getControlNodeParams(control, controlCnstr, environment);

        result = {
            attributes: options.attributes,
            events: options.events,
            control: control,
            errors: serialized && serialized.errors,
            controlClass: controlCnstr,
            options: optionsWithState,
            internalOptions: internalOptions,
            optionsVersions: optionsVersions,
            internalVersions: internalVersions,
            id: control._instId || 0,
            parent: parentNode,
            key: key,
            defaultOptions: defaultOptions,
            markup: invisible ? textNode('') : undefined,
            fullMarkup: undefined,
            childrenNodes: ARR_EMPTY,
            markupDecorator: params && params.markupDecorator,
            serializedChildren: serialized && serialized.childrenNodes,
            hasCompound: false,
            receivedState: undefined,
            invisible: invisible,

            contextVersions: contextVersions,
            context: (vnode && vnode.context) || {},
            inheritOptions: (vnode && vnode.inheritOptions) || {}
        };

        environment.setupControlNode(result);
    }
    // Девтулзы используют это значение в качестве идентификатора. Нельзя использовать саму контрол ноду, т.к.
    // иногда обход идёт по виртуальным нодам, а иногда по контрол нодам, и виртуальные ноды создаются раньше.
    result.vnode = vnode;

    return result;
}

export function createInstance(cnstr, userOptions, internalOptions, configForCreateInstance) {
    internalOptions = internalOptions || {};

    const actualOptions = configForCreateInstance.getActualOptions(cnstr, userOptions, internalOptions);

    if (internalOptions.logicParent) {
        actualOptions._logicParent = internalOptions.logicParent;
    }

    const defaultOpts = OptionsResolver.getDefaultOptions(cnstr);
    OptionsResolver.resolveOptions(cnstr, defaultOpts, actualOptions);

    let inst;
    try {
        inst = new cnstr(actualOptions);
    }
    catch (error) {
        // @ts-ignore
        const coreControl = requirejs('UI/Base').Control;
        inst = new coreControl();
        Logger.lifeError('constructor', cnstr.prototype, error);
    }

    /*Здесь родитель может быть CompoundControl*/
    if (internalOptions.logicParent && internalOptions.logicParent._children && userOptions.name) {
        internalOptions.logicParent._children[userOptions.name] = inst;
    }

    configForCreateInstance.createInstanceCallback(inst, actualOptions, internalOptions);

    return {
        instance: inst,
        resolvedOptions: actualOptions,
        defaultOptions: defaultOpts
    };
}
