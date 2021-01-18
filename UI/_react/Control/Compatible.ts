import {Component} from 'react';
import {reactiveObserve} from './ReactiveObserver';
import {_IGeneratorType, OptionsResolver} from "UI/Executor";
import {getGeneratorConfig} from './GeneratorConfig';
import startApplication from './startApplication';
import {makeRelation, removeRelation} from './ParentFinder';
import {Logger, needToBeCompatible} from "UI/Utils";
import {_FocusAttrs, _IControl, goUpByControlTree} from "UI/Focus";
import {ContextResolver} from "UI/Contexts";
import {constants} from "Env/Env";
import * as ReactDOM from "react-dom";
import * as React from "react";

// @ts-ignore
import template = require('wml!UI/_react/Control/Compatible');
import {ReactiveObserver} from "UI/Reactivity";

let countInst = 1;

export type TemplateFunction = (data: any, attr?: any, context?: any, isVdom?: boolean, sets?: any,
                                forceCompatible?: boolean,
                                generatorConfig?: _IGeneratorType.IGeneratorConfig) => string|object;

type IControlChildren = Record<string, Element | Control | Control<IControlOptions, {}>>;

export interface ITemplateAttrs {
    key?: string;
    internal?: Record<string, any>;
    inheritOptions?: Record<string, any>;
    attributes?: Record<string, any>;
    templateContext?: Record<string, any>;
    context?: Record<string, any>;
    domNodeProps?: Record<string, any>;
    events?: Record<string, any>;
};

interface IControlState {
    loading: boolean;
}

interface IState {
}
type TIState = void | IState;

export interface IControlOptions {
    readOnly?: boolean;
    theme?: string;
}

// const BL_MAX_EXECUTE_TIME = 5000;
const CONTROL_WAIT_TIMEOUT = 20000;

const _private = {
    configureCompatibility(domElement: HTMLElement, cfg: any, ctor: any): boolean {
        if (!constants.compat) {
            return false;
        }

        // вычисляем родителя физически - ближайший к элементу родительский контрол
        const parent = goUpByControlTree(domElement)[0];

        if (needToBeCompatible(ctor, parent)) {
            cfg.element = domElement;

            if (parent && parent._options === cfg) {
                Logger.error('Для создания контрола ' + ctor.prototype._moduleName +
                   ' в качестве конфига был передан объект с опциями его родителя ' + parent._moduleName +
                   '. Не нужно передавать чужие опции для создания контрола, потому что они могут ' +
                   'изменяться в процессе создания!', this);
            } else {
                cfg.parent = cfg.parent || parent;
            }
            return true;
        } else {
            return false;
        }
    }
};

/**
 * Базовый контрол, наследник React.Component с поддержкой совместимости с Wasaby
 * @class UI/ReactComponent/Control
 * @author Mogilevsky Ivan
 * @public
 */
export class Control<TOptions extends IControlOptions = {}, TState extends TIState = void>
   extends Component<TOptions, IControlState> implements _IControl {
    private _firstRender: boolean = true;
    private _asyncMount: boolean = false;
    private _$observer: Function = reactiveObserve;
    protected _container: HTMLElement = null;
    protected _children: IControlChildren = {};
    protected _template: TemplateFunction;
    protected _options: TOptions = {} as TOptions;
    //@ts-ignore
    private _reactiveStart: boolean = false;

    private readonly _instId: string = 'inst_' + countInst++;

    // @ts-ignore
    private _isRendered: boolean;

    constructor(props: TOptions) {
        super(props);
        this._options = props;
        this.state = {
            loading: true
        };
    }

    getInstanceId(): string {
        return this._instId;
    }

    _notify(eventName: string, args?: unknown[], options?: {bubbling?: boolean}): void {
        // nothing for a while...
    }
    activate(cfg: { enableScreenKeyboard?: boolean, enableScrollToElement?: boolean } = {}): void {
        // nothing for a while...
    }
    _forceUpdate(): void {
        this.forceUpdate();
    }

    /* Start: Compatible lifecicle hooks */

    /**
     * Хук жизненного цикла контрола. Вызывается непосредственно перед установкой контрола в DOM-окружение.
     * @param {Object} options Опции контрола.
     * @param {Object} contexts Поля контекста, запрошенные контролом.
     * @param {Object} receivedState Данные, полученные посредством серверного рендеринга.
     * @remark
     * Первый хук жизненного цикла контрола и единственный хук, который вызывается как на стороне сервера, так и на стороне клиента.
     * Он вызывается до рендеринга шаблона, поэтому обычно используется для подготовки данных для шаблона.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _beforeMount(options?: TOptions, contexts?: object, receivedState?: TState): Promise<TState | void> | void {
        // Do
    }
    __beforeMountSSR(options?: TOptions,
                  contexts?: object,
                  receivedState?: TState): Promise<TState | void> | void {
        // @ts-ignore
        if (this._$resultBeforeMount) {
            // @ts-ignore
            return this._$resultBeforeMount;
        }

        let savedOptions;
        // @ts-ignore
        const hasCompatible = this.hasCompatible && this.hasCompatible();
        // в совместимости опции добавилились и их нужно почистить
        if (hasCompatible) {
            savedOptions = this._options;
            this._options = {} as TOptions;
        }

        // включаем реактивность свойств, делаем здесь потому что в constructor рано, там еще может быть не
        // инициализирован _template, например если нативно объявлять класс контрола в typescript и указывать
        // _template на экземпляре, _template устанавливается сразу после вызова базового конструктора
        if (!(typeof process !== 'undefined' && !process.versions)) {
            ReactiveObserver.observeProperties(this);
        }

        const resultBeforeMount = this._beforeMount.apply(this, arguments);

        if (hasCompatible) {
            this._options = savedOptions;
        }

        // prevent start reactive properties if beforeMount return Promise.
        // Reactive properties will be started in Synchronizer
        if (resultBeforeMount && resultBeforeMount.callback) {
            // @ts-ignore
            this._isPendingBeforeMount = true;
            resultBeforeMount.then(() => {
                // @ts-ignore
                this._reactiveStart = true;
                // @ts-ignore
                this._isPendingBeforeMount = false;
            }).catch (() => {
                //nothing
            });

            //start client render
            if (typeof window !== 'undefined') {
                // @ts-ignore
                const clientTimeout = this._clientTimeout ? (this._clientTimeout > CONTROL_WAIT_TIMEOUT ? this._clientTimeout : CONTROL_WAIT_TIMEOUT) : CONTROL_WAIT_TIMEOUT;
                // @ts-ignore
                _private._asyncClientBeforeMount(resultBeforeMount, clientTimeout, this._clientTimeout, this._moduleName, this);
            }
        } else {
            // _reactiveStart means starting of monitor change in properties
            // @ts-ignore
            this._reactiveStart = true;
        }
        // @ts-ignore
        const cssLoading = Promise.resolve();//Promise.all([this.loadThemes(options.theme), this.loadStyles()]);
        // @ts-ignore
        if (constants.isServerSide/* || this.isDeprecatedCSS() || this.isCSSLoaded(options.theme) */) {
            // @ts-ignore
            return this._$resultBeforeMount = resultBeforeMount;
        }
        // @ts-ignore
        return this._$resultBeforeMount = cssLoading.then(() => resultBeforeMount);
    }
    __beforeMount(options?: TOptions,
                  contexts?: object,
                  receivedState?: TState): void {
        if (typeof window === 'undefined') {
            return this.__beforeMountSSR.apply(this, arguments);
        }

        const beforeMountResult = this._beforeMount(this.props);
        if (beforeMountResult && beforeMountResult.then) {
            this._asyncMount = true;
            beforeMountResult.then(() => {
                this._firstRender = false;
                this._reactiveStart = true;
                this.setState({
                    loading: false
                }, () => this._afterMount(this.props));
            });
        } else {
            this._firstRender = false;
            this._reactiveStart = true;
        }
        // TODO: Вынести работу с reactiveProps в генераторы
        // @ts-ignore
        if (this._template.reactiveProps) {
            // @ts-ignore
            this._$observer(this, this._template.reactiveProps);
        }
    }
    __beforeUpdate(newOptions: TOptions, context?: Record<string, any>): void {
        // nothing
    }
    private _setInternalOption(name: string, value: unknown): void {
        // @ts-ignore
        if (!this._internalOptions) {
            // @ts-ignore
            this._internalOptions = {};
        }
        // @ts-ignore
        this._internalOptions[name] = value;
    }
    _setInternalOptions(internal: Record<string, unknown>): void {
        for (const name in internal) {
            if (internal.hasOwnProperty(name)) {
                this._setInternalOption(name, internal[name]);
            }
        }
    }
    getPendingBeforeMountState(): boolean {
        return false;
    }
    saveOptions(options: TOptions, controlNode: any = null): boolean {
        this._options = options as TOptions;
        if (controlNode) {
            this._container = controlNode.element;
        }
        return true;
    }
    _getMarkup(rootKey?: string,
               attributes?: ITemplateAttrs,
               isVdom: boolean = true): void {

        if (!(this._template as any).stable) {
            // @ts-ignore
            Logger.error(`[UI/_base/Control:_getMarkup] Check what you put in _template "${this._moduleName}"`, this);
            // @ts-ignore
            return '';
        }
        let res;

        if (!attributes) {
            attributes = {};
        }
        // @ts-ignore
        attributes.context = this._fullContext;
        // @ts-ignore
        attributes.inheritOptions = this._savedInheritOptions;
        for (const i in attributes.events) {
            if (attributes.events.hasOwnProperty(i)) {
                for (let handl = 0; handl < attributes.events[i].length; handl++) {
                    if (
                       attributes.events[i][handl].isControl &&
                       !attributes.events[i][handl].fn.controlDestination
                    ) {
                        attributes.events[i][handl].fn.controlDestination = this;
                    }
                }
            }
        }
        const generatorConfig = getGeneratorConfig();
        res = this._template(this, attributes, rootKey, isVdom, undefined, undefined, generatorConfig);
        if (res) {
            if (isVdom) {
                if (res.length !== 1) {
                    const message = `В шаблоне может быть только один корневой элемент. Найдено ${res.length} корня(ей).`;
                    Logger.error(message, this);
                }
                for (let k = 0; k < res.length; k++) {
                    if (res[k]) {
                        return res[k];
                    }
                }
            }
        } else {
            res = '';
        }
        return res;
    }
    destroy(): void {
        // nothing
    }
    static _styles: string[] = [];
    static _theme: string[] = [];
    static isWasaby: boolean = true;

    // На данном этапе рисуем индикатор вместо компонента в момен загрузки асинхронного beforeMount
    // private _getLoadingComponent(): ReactElement {
    //     return createElement('img', {
    //         src: '/cdn/LoaderIndicator/1.0.0/ajax-loader-indicator.gif'
    //     });
    // }

    /**
     * Хук жизненного цикла контрола. Вызывается сразу после установки контрола в DOM-окружение.
     * @param {Object} options Опции контрола.
     * @param {Object} context Поле контекста, запрошенное контролом.
     * @remark
     * Первый хук жизненного цикла контрола, который вызывается после подключения контрола к DOM-окружению.
     * На этом этапе вы можете получить доступ к параметрам и контексту this._options.
     * Этот хук жизненного цикла часто используется для доступа к DOM-элементам и подписки на события сервера.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _afterMount(options?: TOptions, context?: object): void {
        // Do
    }

    /**
     * Хук жизненного цикла контрола. Вызывается перед обновлением контрола.
     *
     * @param {Object} newOptions Опции, полученные контролом. Устаревшие опции можно найти в this._options.
     * @param {Object} newContext Контекст, полученный контролом. Устаревшие контексты можно найти в this._context.
     * @remark В этом хуке вы можете сравнить новые и старые опции и обновить состояние контрола.
     * В этом хуке, также, вы можете подготовить все необходимое для визуализации шаблона контрола. Часто код в этом блоке схож с кодом в хуке _beforeMount.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _beforeUpdate(newOptions?: TOptions, newContext?: object): void {
        // Do
    }

    /**
     * Хук жизненного цикла контрола. Вызывается после обновления контрола.
     *
     * @param {Object} oldOptions Опции контрола до обновления контрола.
     * @param {Object} oldContext Поля контекста до обновления контрола.
     * @protected
     */
    protected _afterUpdate(oldOptions?: TOptions, oldContext?: object): void {
        // Do
    }

    /**
     * Хук жизненного цикла контрола. Вызывается до удаления контрола.
     * @remark Это последний хук жизненного цикла контрола. Контрол не будет существовать после вызова этого хука.
     * Его можно использовать для отмены подписки на события сервера и очистки всего, что было сохранено в памяти.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _beforeUnmount(): void {
        // Do
    }

    /* End: Compatible lifecicle hooks */

    /* Start: React lifecicle hooks */

    componentDidMount(): void {
        if (!this._asyncMount) {
            setTimeout(() => {
                makeRelation(this);
                this._afterMount.apply(this);
            }, 0);
        }
    }

    componentDidUpdate(prevProps: TOptions): void {
        this._options = this.props;
        setTimeout(() => {
            makeRelation(this);
            this._afterUpdate.apply(this, [prevProps]);
        }, 0);
    }

    getSnapshotBeforeUpdate(): void {
        if (!this._firstRender) {
            if (document.documentElement && !document.documentElement.classList.contains('pre-load')) {
                this._reactiveStart = false;
                this._beforeUpdate.apply(this, [this.props]);
                this._reactiveStart = true;
            }
        }
        return null;
    }

    componentWillUnmount(): void {
        removeRelation(this);
        this._beforeUnmount.apply(this);
    }

    saveInheritOptions(): any {

    }
    _saveContextObject(): any {

    }
    saveFullContext(): any {

    }

    render(empty?: any, attributes?: any): unknown {
        if (typeof window === 'undefined') {
            let markup;
            ReactiveObserver.forbidReactive(this, () => {
                markup = this._getMarkup(null, attributes, false);
            });
            this._isRendered = true;
            return markup;
        }

        if (this._firstRender) {
            this.__beforeMount();
        }

        if (this._asyncMount && this.state.loading) {
            return null;//this._getLoadingComponent();
        }

        const generatorConfig = getGeneratorConfig();
        //@ts-ignore
        window.reactGenerator = true;
        const ctx = {...this, _options: {...this.props}};
        //@ts-ignore
        const res = this._template(ctx, {}, undefined, undefined, undefined, undefined, generatorConfig);
        // прокидываю тут аргумент isCompatible, но можно вынести в билдер
        const originRef = res[0].ref;
        if (originRef) {
            res[0] = {...res[0], ref: (node) => {
                    return originRef.apply(this, [node, true]);
                }
            };
        }
        //@ts-ignore
        window.reactGenerator = false;
        return res;
    }
    static createControl(ctor: any, cfg: any, domElement: HTMLElement): Control {
        if (domElement) {
            // если пришел jquery, вытащим оттуда элемент
            domElement = domElement[0] || domElement;
        }
        if (!(ctor && ctor.prototype)) {
            const message = '[UI/_base/Control:createControl] Аргумент ctor должен являться классом контрола!';
            Logger.error(message, ctor.prototype);
        }
        if (!(domElement instanceof HTMLElement)) {
            const message = '[UI/_base/Control:createControl] domElement parameter is not an instance of HTMLElement. You should pass the correct dom element to control creation function.';
            Logger.error(message, ctor.prototype);
        }
        if (!document.documentElement.contains(domElement)) {
            const message = '[UI/_base/Control:createControl] domElement parameter is not contained in document. You should pass the correct dom element to control creation function.';
            Logger.error(message, ctor.prototype);
        }

        const compatible = _private.configureCompatibility(domElement, cfg, ctor);
        cfg._$createdFromCode = true;

        startApplication();
        const defaultOpts = OptionsResolver.getDefaultOptions(ctor);
        // @ts-ignore
        OptionsResolver.resolveOptions(ctor, defaultOpts, cfg);
        const attrs = { inheritOptions: {} };
        let ctr;
        OptionsResolver.resolveInheritOptions(ctor, attrs, cfg, true);
        try {
            ctr = new ctor(cfg);
        } catch (error) {
            ctr = new Control({});
            Logger.lifeError('constructor', ctor.prototype, error)
        }
        ctr.saveInheritOptions(attrs.inheritOptions);
        ctr._container = domElement;
        _FocusAttrs.patchDom(domElement, cfg);
        ctr.saveFullContext(ContextResolver.wrapContext(ctr, { asd: 123 }));

        if (compatible) {
            if (requirejs.defined('Core/helpers/Hcontrol/makeInstanceCompatible')) {
                const makeInstanceCompatible = requirejs('Core/helpers/Hcontrol/makeInstanceCompatible');
                makeInstanceCompatible(ctr, cfg);
            }
        }

        if (document.documentElement.classList.contains('pre-load')) {
            ReactDOM.hydrate(React.createElement(ctor, cfg, null), ctr._container.parentNode);
        } else {
            ReactDOM.render(React.createElement(ctor, cfg, null), ctr._container.parentNode);
        }
        //TODO надо дожидаться создания контрола
        // и когда появится ссылка на инстанс выполнять
        // те действия которые в этом методе описаны

        return ctr;
    }
}

Object.assign(Control.prototype, {
    _template: template
});
