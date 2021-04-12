import { Component, createElement } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { EMPTY_THEME, getThemeController } from 'UICommon/theme/controller';
import { getResourceUrl, Logger} from 'UICommon/Utils';
import { Options } from 'UICommon/Vdom';
import { makeWasabyObservable, releaseProperties } from 'UICore/WasabyReactivity';

import template = require('wml!UICore/_base/Control');
import { IControlState, TemplateFunction } from './interfaces';
import {
    getWasabyContext,
    IWasabyContextValue,
    WasabyContextManager,
    TWasabyContext
} from 'UICore/Contexts';

import { OptionsResolver } from 'UICommon/Executor';

import { WasabyEvents, callNotify } from 'UICore/Events';
import { IWasabyEventSystem } from 'UICommon/Events';
import { TIState } from 'UICommon/interfaces';
import { IControlOptions } from 'UICommon/Base';

/**
 * Базовый контрол, наследник React.Component с поддержкой совместимости с Wasaby
 * @author Mogilevsky Ivan
 * @public
 */
export default class Control<TOptions extends IControlOptions = {},
    TState extends TIState = void> extends Component<TOptions, IControlState> {
    /**
     * Используется для того, чтобы не вызывать хуки ЖЦ до реального построения контрола.
     */
    private _$controlMounted: boolean = false;
    /**
     * Набор детей контрола, для которых задан атрибут name.
     */
    protected _children: Record<string, Element | Control> = {};
    /**
     * Шаблон контрола.
     */
    protected _template: TemplateFunction;
    /**
     * Реальные опции контрола. Туда собираются значения из props и context.
     * ВАЖНО: значения могут не совпадать с props в некоторые моменты времени,
     * чтобы в хуках были правильные значения.
     */
    _options: TOptions = {} as TOptions;

    /**
     * Версии опций для версионируемых объектов.
     */
    _optionsVersions: Options.IVersions;

    // FIXME: не понимаю зачем объявлять _theme и _styles дважды: здесь и ниже.
    /** @deprecated */
    protected _theme: string[];
    /** @deprecated */
    protected _styles: string[];
    /**
     * Название контрола.
     */
    _moduleName: string;
    reactiveValues: object;

    protected _notify(eventName: string, args?: unknown[], options?: { bubbling?: boolean }): unknown {
        return callNotify(this, eventName, args, options);
    }

    protected activate(): void {

    }

    constructor(props: TOptions, context?: IWasabyContextValue) {
        super(props);
        /*
        Если люди сами задают конструктор, то обычно они вызывают его неправильно (передают только один аргумент).
        Из-за этого контекст может потеряться и не получится в конструкторе вытащить значение из него.
         */
        if (!context) {
            Logger.error(
                `[${this._moduleName}] Неправильный вызов родительского конструктора, опции readOnly и theme могут содержать некорректные значения. Для исправления ошибки нужно передать в родительский конструктор все аргументы.`
            );
        }
        this.state = {
            loading: true,
            // Флаг изменения реактивных свойств на instance, необходим для того, чтобы понять,
            // что необходимо перерисовать компонент
            observableVersion: 0
        };
        const constructor = this.constructor as React.ComponentType;
        // Записываем в статическое поле компонента имя для удобной работы через React DevTools
        if (!constructor.displayName) {
            constructor.displayName = this._moduleName;
        }
        this._optionsVersions = {};
    }

    /**
     * Запускает обновление. Нужен из-за того, что всех переводить на новое название метода не хочется.
     */
    _forceUpdate(): void {
        // При forceUpdate() не вызывается метод shouldComponentUpdate() и хук shouldUpdate()
        // Текущая логика работы wasaby, при изменении на инстансе и _forceUpdate() вызывается shouldUpdate() всегда
        this.setState(({observableVersion}: IControlState) => ({
            observableVersion: observableVersion + 1
        }));
    }

    /**
     * Хук жизненного цикла контрола. Вызывается непосредственно перед установкой контрола в DOM-окружение.
     * @param options Опции контрола.
     * @param contexts Поля контекста, запрошенные контролом.
     * @param receivedState Данные, полученные посредством серверного рендеринга.
     * @remark
     * Первый хук жизненного цикла контрола и единственный хук, который вызывается как на стороне сервера, так и на стороне клиента.
     * Он вызывается до рендеринга шаблона, поэтому обычно используется для подготовки данных для шаблона.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _beforeMount(
        options?: TOptions,
        contexts?: object,
        receivedState?: TState
    ): Promise<TState | void> | void {
        // Do
    }

    /*
    Раньше этот метод назывался __beforeMount, был публичным и мог вызваться из Markup/Builder.
    Сейчас он специально переименован и сделан приватным, чтобы было явно понятно где он используется.
    По-хорошему, всё построение должно происходить через вызов render, а если захочется пойти
    другим путём - придётся написать комментарий зачем.
     */
    /**
     * Вызывает пользовательский _beforeMount+выполняет работы ядра, которые нужно делать перед построением.
     * @param options Опции контрола.
     * @private
     */
    private _beforeFirstRender(options: TOptions): boolean {
        const promisesToWait = [];
        const res = this._beforeMount(options);

        // Данный метод должен вызываться только при первом построении, поэтому очистим его на инстансе при вызове
        this._beforeFirstRender = undefined;
        makeWasabyObservable<TOptions, TState>(this);

        if (res && res.then) {
            promisesToWait.push(res);
        }

        if (!this.isDeprecatedCSS() && !this.isCSSLoaded(options.theme)) {
            const cssLoading = Promise.all([
                this.loadThemes(options.theme),
                this.loadStyles(),
                this.loadThemeVariables(options.theme)
            ]);
            promisesToWait.push(cssLoading.then(nop));
        }

        if (promisesToWait.length) {
            Promise.all(promisesToWait).then(() => {
                this.setState(
                    {
                        loading: false
                    },
                    () => {
                        this._options = options;
                        this._componentDidMount(options);
                        setTimeout(() => {
                            this._afterMount(options);
                            this._$controlMounted = true;
                        }, 0);
                    }
                );
            });
            return true;
        } else {
            this._options = options;
            this._$controlMounted = true;
            return false;
        }
    }

    /**
     * Хук жизненного цикла контрола. Вызывается сразу после установки контрола в DOM-окружение.
     * @param options Опции контрола.
     * @param context Поле контекста, запрошенное контролом.
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
     * Синхронный хук жизненного цикла контрола. Вызывается сразу после установки контрола в DOM-окружение.
     * @param {Object} options Опции контрола.
     * @param {Object} context Поле контекста, запрошенное контролом.
     * @example
     * <pre class="brush: js">
     *    Control.extend({
     *       ...
     *       _componentDidMount(options, context) {
     *          this.subscribeToServerEvents();
     *          this.buttonHeight = this._children.myButton.offsetHeight;
     *       }
     *       ...
     *    });
     * </pre>
     * @remark
     * Первый хук жизненного цикла контрола, который вызывается после подключения контрола к DOM-окружению.
     * На этом этапе вы можете получить доступ к параметрам и контексту this._options.
     * Этот хук жизненного цикла часто используется для доступа к DOM-элементам и подписки на события сервера.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _componentDidMount(options?: TOptions, context?: object): void {
        // Do
    }

    /**
     * Определяет, должен ли контрол обновляться. Вызывается каждый раз перед обновлением контрола.
     *
     * @param options Опции контрола.
     * @param [context] Поле контекста, запрошенное контролом. Параметр считается deprecated, поэтому откажитесь от его использования.
     * @returns {Boolean}
     * * true (значание по умолчанию): контрол будет обновлен.
     * * false: контрол не будет обновлен.
     * @example
     * Например, если employeeSalary является единственным параметром, используемым в шаблоне контрола,
     * можно обновлять контрол только при изменении параметра employeeSalary.
     * <pre class="brush: html">
     *    Control.extend({
     *       ...
     *       _shouldUpdate: function(newOptions, newContext) {
     *          if (newOptions.employeeSalary === this._options.employeeSalary) {
     *             return false;
     *          }
     *       }
     *       ...
     *    });
     * </pre>
     * @remark
     * Хук жизненного цикла контрола вызывается после хука _beforeUpdate перед перестроением шаблона. Этот хук можно использовать для оптимизаций.
     * Вы можете сравнить новые и текущие параметры и вернуть false, если нет необходимости пересчитывать DOM-дерево контрола.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _shouldUpdate(options: TOptions, context?: object): boolean {
        return true;
    }

    /**
     * Хук жизненного цикла контрола. Вызывается перед обновлением контрола.
     *
     * @param newOptions Опции, полученные контролом. Устаревшие опции можно найти в this._options.
     * @param newContext Контекст, полученный контролом. Устаревшие контексты можно найти в this._context.
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
     * @param oldOptions Опции контрола до обновления контрола.
     * @param oldContext Поля контекста до обновления контрола.
     * @protected
     */
    protected _afterUpdate(oldOptions?: TOptions, oldContext?: object): void {
        // Do
    }

    protected _afterRender(oldOptions?: TOptions, oldContext?: any): void {
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

    private isDeprecatedCSS(): boolean {
        const isDeprecatedCSS =
            this._theme instanceof Array || this._styles instanceof Array;
        if (isDeprecatedCSS) {
            Logger.warn(
                `Стили и темы должны перечисляться в статическом свойстве класса ${this._moduleName}`
            );
        }
        return isDeprecatedCSS;
    }

    private isCSSLoaded(themeName?: string): boolean {
        const themes = this._theme instanceof Array ? this._theme : [];
        const styles = this._styles instanceof Array ? this._styles : [];
        // FIXME: Поддержка старых контролов с подгрузкой тем и стилей из статических полей
        return Control.isCSSLoaded(themeName, themes, styles);
    }

    private loadThemes(themeName?: string): Promise<void> {
        const themes = this._theme instanceof Array ? this._theme : [];
        // FIXME: Поддержка старых контролов с подгрузкой тем и стилей из статических полей
        return Control.loadThemes(themeName, themes).catch(logError);
    }

    private loadStyles(): Promise<void> {
        const styles = this._styles instanceof Array ? this._styles : [];
        // FIXME: Поддержка старых контролов с подгрузкой тем и стилей из статических полей
        return Control.loadStyles(styles).catch(logError);
    }

    private loadThemeVariables(themeName?: string): Promise<void> {
        return Control.loadThemeVariables(themeName).catch(logError);
    }

    componentDidMount(): void {
        if (this._$controlMounted) {
            const newOptions = createWasabyOptions(this.props, this.context);
            this._componentDidMount(newOptions);
            setTimeout(() => {
                this._afterMount(newOptions);
            }, 0);
        }
    }

    shouldComponentUpdate(newProps: TOptions, newState: IControlState): boolean {
        const newOptions = createWasabyOptions(newProps, this.context);
        const changedOptions = !!Options.getChangedOptions(
            newProps,
            this._options,
            false,
            this._optionsVersions
        );
        const reactiveStartUpdate = newState.observableVersion !== this.state.observableVersion;
        // Если обновление запустила реактивность, нам надо перерисовать компонент
        return (changedOptions && this._shouldUpdate(newOptions)) || reactiveStartUpdate;
    }

    componentDidUpdate(prevProps: TOptions): void {
        if (this._$controlMounted) {
            const oldOptions = this._options;
            this._options = createWasabyOptions(this.props, this.context);
            this._optionsVersions = Options.collectObjectVersions(this._options);
            this._afterRender(oldOptions);
            setTimeout(() => {
                this._afterUpdate(oldOptions);
            }, 0);
        }
    }

    getSnapshotBeforeUpdate(): null {
        if (this._$controlMounted) {
            try {
                const newOptions = createWasabyOptions(this.props, this.context);
                this._beforeUpdate(newOptions);
            } catch (e) {
                logError(e);
            }
        }
        return null;
    }

    componentWillUnmount(): void {
        this._beforeUnmount.apply(this);
        releaseProperties<TOptions, TState>(this);
    }

    render(): React.ReactNode {
        const wasabyOptions = createWasabyOptions(this.props, this.context);

        /*
        Валидируем опции именно здесь по двум причинам:
        1) Здесь они уже полностью вычислены.
        2) Мы должны попадать сюда при любом построении.
        На propTypes всех не перевели, потому что это не помогло бы - часть опций (readOnly и theme)
        берётся из контекста.
        */
        OptionsResolver.validateOptions(this.constructor, wasabyOptions);

        const asyncMount = this._beforeFirstRender && this._beforeFirstRender(wasabyOptions);

        if (asyncMount && this.state.loading) {
            return getLoadingComponent();
        }

        let res;
        try {
            // this клонируется, чтобы вызвать шаблон с новыми значениями опций, но пока не класть их на инстанс.
            const ctx = {...this, _options: {...wasabyOptions}};
            res = this._template(ctx, undefined, undefined, true);
        } catch (e) {
            logError(e);
            res = [];
        }

        return createElement(
            WasabyContextManager,
            {
                readOnly: wasabyOptions.readOnly,
                theme: wasabyOptions.theme
            },
            res[0]
        );
    }

    /**
     * Контекст с опциями readOnly и theme
     */
    static readonly contextType: TWasabyContext = getWasabyContext();

    /**
     * Массив имен нетемизированных стилей, необходимых контролу.
     * Все стили будут скачаны при создании
     *
     * @static
     * @example
     * <pre>
     *   static _styles: string[] = ['Controls/Utils/getWidth'];
     * </pre>
     */
    static _styles: string[] = [];
    /**
     * Массив имен темизированных стилей, необходимых контролу.
     * Все стили будут скачаны при создании
     *
     * @static
     * @example
     * <pre>
     *   static _theme: string[] = ['Controls/popupConfirmation'];
     * </pre>
     */
    static _theme: string[] = [];

    /**
     * Загрузка стилей и тем контрола
     * @param themeName имя темы (по-умолчанию тема приложения)
     * @param themes массив доп тем для скачивания
     * @param styles массив доп стилей для скачивания
     * @static
     * @public
     * @method
     * @example
     * <pre class="brush: js">
     *     import('Controls/_popupTemplate/InfoBox')
     *         .then((InfoboxTemplate) => InfoboxTemplate.loadCSS('saby__dark'))
     * </pre>
     */
    static loadCSS(
        themeName?: string,
        themes: string[] = [],
        styles: string[] = []
    ): Promise<void> {
        return Promise.all([
            this.loadStyles(styles),
            this.loadThemes(themeName, themes)
        ]).then(nop);
    }

    /**
     * Загрузка тем контрола
     * @param instThemes опционально дополнительные темы экземпляра
     * @param themeName имя темы (по-умолчанию тема приложения)
     * @static
     * @private
     * @method
     * @example
     * <pre>
     *     import('Controls/_popupTemplate/InfoBox')
     *         .then((InfoboxTemplate) => InfoboxTemplate.loadThemes('saby__dark'))
     * </pre>
     */
    static loadThemes(
        themeName?: string,
        instThemes: string[] = []
    ): Promise<void> {
        const themeController = getThemeController();
        const themes = instThemes.concat(this._theme);
        if (themes.length === 0) {
            return Promise.resolve();
        }
        return Promise.all(
            themes.map((name) => themeController.get(name, themeName))
        ).then(nop);
    }

    /**
     * Вызовет загрузку коэффициентов (CSS переменных) для тем.
     * @param {String} themeName имя темы. Например: "default", "default__cola" или "retail__light-medium"
     * @static
     * @public
     * @method
     * @example
     * <pre>
     *     import('Controls/_popupTemplate/InfoBox')
     *         .then((InfoboxTemplate) => InfoboxTemplate.loadThemeVariables('default__cola'))
     * </pre>
     */
    static loadThemeVariables(themeName?: string): Promise<void> {
        if (!themeName) {
            return Promise.resolve();
        }
        return getThemeController().getVariables(themeName);
    }

    /**
     * Загрузка стилей контрола
     * @param instStyles (опционально) дополнительные стили экземпляра
     * @static
     * @private
     * @method
     * @example
     * <pre>
     *     import('Controls/_popupTemplate/InfoBox')
     *         .then((InfoboxTemplate) => InfoboxTemplate.loadStyles())
     * </pre>
     */
    static loadStyles(instStyles: string[] = []): Promise<void> {
        const themeController = getThemeController();
        const styles = instStyles.concat(this._styles);
        if (styles.length === 0) {
            return Promise.resolve();
        }
        return Promise.all(
            styles.map((name) => themeController.get(name, EMPTY_THEME))
        ).then(nop);
    }

    /**
     * Удаление link элементов из DOM
     * @param themeName имя темы (по-умолчанию тема приложения)
     * @param instThemes опционально собственные темы экземпляра
     * @param instStyles опционально собственные стили экземпляра
     * @static
     * @method
     */
    static removeCSS(
        themeName?: string,
        instThemes: string[] = [],
        instStyles: string[] = []
    ): Promise<void> {
        const themeController = getThemeController();
        const styles = instStyles.concat(this._styles);
        const themes = instThemes.concat(this._theme);
        if (styles.length === 0 && themes.length === 0) {
            return Promise.resolve();
        }
        const removingStyles = Promise.all(
            styles.map((name) => themeController.remove(name, EMPTY_THEME))
        );
        const removingThemed = Promise.all(
            themes.map((name) => themeController.remove(name, themeName))
        );
        return Promise.all([removingStyles, removingThemed]).then(nop);
    }

    /**
     * Проверка загрузки стилей и тем контрола
     * @param themeName имя темы (по-умолчанию тема приложения)
     * @param instThemes массив доп тем для скачивания
     * @param instStyles массив доп стилей для скачивания
     * @static
     * @public
     * @method
     */
    static isCSSLoaded(
        themeName?: string,
        instThemes: string[] = [],
        instStyles: string[] = []
    ): boolean {
        const themeController = getThemeController();
        const themes = instThemes.concat(this._theme);
        const styles = instStyles.concat(this._styles);
        if (styles.length === 0 && themes.length === 0) {
            return true;
        }
        return (
            themes.every((cssName) =>
                themeController.isMounted(cssName, themeName)
            ) &&
            styles.every((cssName) =>
                themeController.isMounted(cssName, EMPTY_THEME)
            )
        );
    }

    /**
     * Создаёт и монтирует контрол на элемент
     * @param ctor Конструктор контрола.
     * @param cfg Опции контрола.
     * @param domElement Элемент, на который должен быть смонтирован контрол.
     */
    static createControl<P extends IControlOptions, T extends HTMLElement & {eventSystem?: IWasabyEventSystem}>(
        ctor: React.ComponentType<P>,
        cfg: P,
        domElement: T
    ): void {
        // кладём в конфиг наследуемые опции, чтобы они попали в полноценные опции
        cfg.theme = cfg.theme ?? 'default';
        cfg.readOnly = cfg.readOnly ?? false;
        domElement.eventSystem = new WasabyEvents(domElement);
        ReactDOM.render(React.createElement(ctor, cfg), domElement);
    }

    /**
     * Старый способ наследоваться
     * @param mixinsList массив миксинов либо расширяющий класс (если один аргумент)
     * @param classExtender расширяюший класс
     */
    static extend(mixinsList: object | object[], classExtender?: object): Function {
        class ExtendedControl extends Control {
        }

        if (Array.isArray(mixinsList)) {
            mixinsList.forEach((mixin) => {
                Object.keys(mixin).forEach((key) => {
                    ExtendedControl.prototype[key] = mixinsList[key];
                });
                Object.keys(classExtender).forEach((key) => {
                    ExtendedControl.prototype[key] = mixinsList[key];
                });
            });
        } else {
            Object.keys(mixinsList).forEach((key) => {
                ExtendedControl.prototype[key] = mixinsList[key];
            });
        }
        return ExtendedControl;
    }
}

/*
FIXME: если я правильно понимаю, это сделано для того, чтобы _template
инициализировался не в конструкторе, а всего один раз. Но ведь того же самого
можно было добиться через статическое поле.
 */
Object.assign(Control.prototype, {
    _template: template
});

function logError(e: Error): void {
    Logger.error(e.message);
}

/**
 * Подмешивает к реактовским опциям значения theme и readOnly из контекста.
 * Если в реактовских опциях были какие-то значения, то возьмутся они.
 * @param props Опции из реакта.
 * @param contextValue Контекст с наследуемыми опциями.
 */
function createWasabyOptions<T extends IControlOptions>(
    props: T,
    contextValue: IWasabyContextValue
): T {
    // клон нужен для того, чтобы не мутировать реактовские опции при подкладывании readOnly и theme
    const newProps = {...props};
    newProps.readOnly = props.readOnly ?? contextValue?.readOnly;
    newProps.theme = props.theme ?? contextValue?.theme;
    return newProps;
}

// На данном этапе рисуем индикатор вместо компонента в момент загрузки асинхронного beforeMount
function getLoadingComponent(): React.ReactElement {
    return createElement('img', {
        src: getResourceUrl(
            '/cdn/LoaderIndicator/1.0.0/ajax-loader-indicator.gif'
        )
    });
}

const nop = () => undefined;
