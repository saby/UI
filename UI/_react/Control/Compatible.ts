import {Component, createElement} from 'react';
import {reactiveObserve, releaseProperties} from './ReactiveObserver';
import {getGeneratorConfig} from './GeneratorConfig';
import {makeRelation, removeRelation} from './ParentFinder';
import {EMPTY_THEME, getThemeController} from 'UI/theme/controller';
import {Logger, Purifier} from 'UI/Utils';
import {_IControl} from 'UI/Focus';
import {constants} from 'Env/Env';
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {ReactiveObserver} from 'UI/Reactivity';
import {createEnvironment} from 'UI/_react/Control/EnvironmentStorage';
import {prepareControlNodes} from './ControlNodes';
import {TClosure} from 'UI/Executor';

// @ts-ignore путь не определяется
import template = require('wml!UI/_react/Control/Compatible');
import {
   IControlChildren, IControlOptions, IControlState, TIState, TemplateFunction,
   IDOMEnvironment, ITemplateAttrs, TControlConstructor, IControl, IControlNode
} from './interfaces';

interface IControlFunction extends Function {
   /**
    * Имя react компонента выводимое в DevTools
    */
   displayName: string;
}

let countInst = 1;
/**
 * Храним html тега head для того, чтобы отрисовать его после гидрации
 */
let _innerHeadHtml: string;

// конфигурация созданного контрола, часть метода createControl
function configureControl(parameters: {
   control: Control,
   domElement: HTMLElement
}): void {
    parameters.control._saveEnvironment(createEnvironment(parameters.domElement));
}

// вычисляет является ли сейчас фаза оживления страницы
function isHydrating(): boolean {
   const docElement = document?.documentElement;
   return !docElement || docElement.classList.contains('pre-load');
}

/**
 * Базовый контрол, наследник React.Component с поддержкой совместимости с Wasaby
 * @class UI/ReactComponent/Control
 * @author Mogilevsky Ivan
 * @public
 */
export class Control<TOptions extends IControlOptions = {}, TState extends TIState = void>
   extends Component<TOptions, IControlState> implements _IControl, IControl {
   private _firstRender: boolean = true;
   private _asyncMount: boolean = false;
   private _$observer: Function = reactiveObserve;
   // контейнер контрола
   // добавлено потому что это используемое api контрола
   _container: HTMLElement = null;
   // набор детей контрола, элементы или контролы, которым задан атрибут name (является ключом)
   // добавлено потому что это используемое api контрола
   protected _children: IControlChildren = {};
   // шаблон контрола
   // добавлен потому что используемое апи контрола
   protected _template: TemplateFunction;
   _options: TOptions = {} as TOptions;
   /** @deprecated */
   protected _theme: string[];
   /** @deprecated */
   protected _styles: string[];
   // флаг показывает, работает ли реактивность у контрола
   // добавлено потому что используется в реактивных свойствах
   _reactiveStart: boolean = false;
   // хранилище значений реактивных полей
   // добавлено потому что используется в реактивных свойствах
   reactiveValues: object;
   // окружение DOMEnvironment контрола
   // добавлено потому что используется в системе фокусов (_getEnvironment)
   _environment: IDOMEnvironment;
   // текущая controlNode контрола
   // добавлено для работы системы событий, т.к должны всплывать с учетом controlNode
   _controlNode: IControlNode;
   // логический родитель контрола
   // добавлено чтобы при создании ControlNode вычислять поле environment, которое хранится среди родителей
   // также используется в прикладных и платформенных wasaby-контролах в качестве костылей
   _logicParent: IControl;
   // родительский хок (если есть)
   // используется чтобы расставить на родительских хоках _container
   // в реф хока мы попадем в момент, когда контейнера еще нет, так что надо отложить инициализацию
   _parentHoc: IControl;
   // название модуля контрола
   // добавлено потому что используется при выводе логов и для костылей
   _moduleName: string;
   // id контрола
   // добавлено чтобы выводиться в getInstanceId, а getInstanceId это используемое апи контрола
   private readonly _instId: string = 'inst_' + countInst++;

   constructor(props: TOptions) {
      super(props);
      this._options = props;
      this.state = {
         loading: true
      };
      const constructor = this.constructor as IControlFunction;
      /**
       * Записываем в статическое поле компонента имя для удобной работы через React DevTools
       */
      if (!constructor.displayName) {
         constructor.displayName = this._moduleName;
      }
      this._logicParent = props._logicParent;
   }

   // возвращает id, используется пользователями
   // добавлено потому что это используемое api контрола
   getInstanceId(): string {
      return this._instId;
   }

   // запуск события - сейчас заглушка. удалить нельзя, это самое простое решение
   _notify(eventName: string, args?: unknown[], options?: { bubbling?: boolean }): void {
      if (args && !(args instanceof Array)) {
         var error = `Ошибка использования API событий.
                     В метод _notify() в качестве второго аргументов необходимо передавать массив 
                     Был передан объект типа ${typeof args}
                     Событие: ${eventName}
                     Аргументы: ${args}
                     Подробнее о событиях: https://wasaby.dev/doc/platform/ui-library/events/#params-from-notify`;
             Logger.error(error, this);
         throw new Error(error);
      }
      return this._environment && this._environment.startEvent(this._controlNode, arguments);
   }
   // активация контрола - сейчас заглушка. удалить нельзя, это самое простое решение
   activate(cfg: { enableScreenKeyboard?: boolean, enableScrollToElement?: boolean } = {}): void {
      // nothing for a while...
   }

   // запускает перерисовку
   // добавлено потому что используемое апи контрола
   _forceUpdate(): void {
      this.forceUpdate();
   }

   // сохраняет окружение контрола
   // добавлено потому что используется в configureControl для инициализации environment
   _saveEnvironment(env: IDOMEnvironment, controlNode?: IControlNode): void {
      this._environment = env;
      this._controlNode = controlNode;
   }

   // возвращает окружение контрола
   // добавлено потому что используется в системе фокусов
   _getEnvironment(): IDOMEnvironment {
      return this._environment;
   }

   /* Start: Compatible lifecycle hooks */

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
   protected _beforeMount(options?: TOptions, contexts?: object, receivedState?: TState):
      Promise<TState | void> | void {
      // Do
   }

   // beforeMount зовется на сервере для поддержки серверной верстки (с учетом промисов)
   __beforeMountSSR(options?: TOptions,
                    contexts?: object,
                    receivedState?: TState): Promise<TState | void> | TState | void {
      let savedOptions;
      // @ts-ignore навешивается в слое совместимости, в чистом контроле такого нет
      const hasCompatible = this.hasCompatible && this.hasCompatible();
      // в совместимости опции добавились и их нужно почистить
      if (hasCompatible) {
         savedOptions = this._options;
         this._options = {} as TOptions;
      }

      const resultBeforeMount = this._beforeMount(options, contexts, receivedState);

      if (hasCompatible) {
         this._options = savedOptions;
      }

      return resultBeforeMount;
   }

   __beforeMount(options?: TOptions,
                 contexts?: object,
                 receivedState?: TState): void {
      /** Загрузка стилей и тем оформления - это обязательно асинхронный процесс */
      const cssLoading = Promise.all([
         this.loadThemes(options.theme),
         this.loadStyles(),
         this.loadThemeVariables(options.theme)
      ]);
      const promisesToWait = [];
      if (!constants.isServerSide && !this.isDeprecatedCSS() && !this.isCSSLoaded(options.theme)) {
         promisesToWait.push(cssLoading.then(nop));
      }
      if (constants.isServerSide) {
         return this.__beforeMountSSR(options, contexts, receivedState) as void;
      }

      const res = this._beforeMount(this.props);

      if (res && res.then) {
         promisesToWait.push(res);
         promisesToWait.push(cssLoading);
      }

      if (promisesToWait.length) {
         this._asyncMount = true;
         Promise.all(promisesToWait).then(() => {
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

      this._$observer(this, this._template);
   }

   // построение верстки контрола
   // добавлено потому что используется в render для построения верстки на сервере
   _getMarkup(rootKey?: string,
              attributes?: ITemplateAttrs): string | object {
      // @ts-ignore флага stable нет на шаблоне и я не знаю как объявить
      if (!(this._template).stable) {
         Logger.error(`[UI/_base/Control:_getMarkup] Check what you put in _template "${this._moduleName}"`, this);
         return '';
      }
      let res;
      if (!attributes) {
         attributes = {};
      }
      const generatorConfig = getGeneratorConfig();
      res = this._template(this, attributes, rootKey, false, undefined, undefined, generatorConfig);
      return res || '';
   }

   // На данном этапе рисуем индикатор вместо компонента в момент загрузки асинхронного beforeMount
   private _getLoadingComponent(): React.ReactElement {
      return createElement('img', {
         src: '/cdn/LoaderIndicator/1.0.0/ajax-loader-indicator.gif'
      });
   }

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

   /* End: Compatible lifecycle hooks */

   /* Start: CSS region */

   private isDeprecatedCSS(): boolean {
      const isDeprecatedCSS = this._theme instanceof Array || this._styles instanceof Array;
      if (isDeprecatedCSS) {
         Logger.warn(`Стили и темы должны перечисляться в статическом свойстве класса ${this._moduleName}`);
      }
      return isDeprecatedCSS;
   }

   private isCSSLoaded(themeName?: string): boolean {
      const themes = this._theme instanceof Array ? this._theme : [];
      const styles = this._styles instanceof Array ? this._styles : [];
      // FIXME: Поддержка старых контролов с подгрузкой тем и стилей из статических полей
      // tslint:disable-next-line:no-string-literal
      return this.constructor['isCSSLoaded'](themeName, themes, styles);
   }

   private loadThemes(themeName?: string): Promise<void> {
      const themes = this._theme instanceof Array ? this._theme : [];
      // FIXME: Поддержка старых контролов с подгрузкой тем и стилей из статических полей
      // tslint:disable-next-line:no-string-literal
      return this.constructor['loadThemes'](themeName, themes).catch(logError);
   }

   private loadStyles(): Promise<void> {
      const styles = this._styles instanceof Array ? this._styles : [];
      // FIXME: Поддержка старых контролов с подгрузкой тем и стилей из статических полей
      // tslint:disable-next-line:no-string-literal
      return this.constructor['loadStyles'](styles).catch(logError);
   }
   private loadThemeVariables(themeName?: string): Promise<void> {
      return this.constructor['loadThemeVariables'](themeName).catch(logError);
   }

   /* End: CSS region */

   /* Start: CSS static region */

   /**
    * Загрузка стилей и тем контрола
    * @param {String} themeName имя темы (по-умолчанию тема приложения)
    * @param {Array<String>} themes массив доп тем для скачивания
    * @param {Array<String>} styles массив доп стилей для скачивания
    * @returns {Promise<void>}
    * @static
    * @public
    * @method
    * @example
    * <pre class="brush: js">
    *     import('Controls/_popupTemplate/InfoBox')
    *         .then((InfoboxTemplate) => InfoboxTemplate.loadCSS('saby__dark'))
    * </pre>
    */
   static loadCSS(themeName?: string, themes: string[] = [], styles: string[] = []): Promise<void> {
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
   static loadThemes(themeName?: string, instThemes: string[] = []): Promise<void> {
      const themeController = getThemeController();
      const themes = instThemes.concat(this._theme);
      if (themes.length === 0) {
         return Promise.resolve();
      }
      return Promise.all(themes.map((name) => themeController.get(name, themeName))).then(nop);
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
      return Promise.all(styles.map((name) => themeController.get(name, EMPTY_THEME))).then(nop);
   }

   /**
    * Удаление link элементов из DOM
    * @param themeName имя темы (по-умолчанию тема приложения)
    * @param instThemes опционально собственные темы экземпляра
    * @param instStyles опционально собственные стили экземпляра
    * @static
    * @method
    */
   static removeCSS(themeName?: string, instThemes: string[] = [], instStyles: string[] = []): Promise<void> {
      const themeController = getThemeController();
      const styles = instStyles.concat(this._styles);
      const themes = instThemes.concat(this._theme);
      if (styles.length === 0 && themes.length === 0) {
         return Promise.resolve();
      }
      const removingStyles = Promise.all(styles.map((name) => themeController.remove(name, EMPTY_THEME)));
      const removingThemed = Promise.all(themes.map((name) => themeController.remove(name, themeName)));
      return Promise.all([removingStyles, removingThemed]).then(nop);
   }

   /**
    * Проверка загрузки стилей и тем контрола
    * @param {String} themeName имя темы (по-умолчанию тема приложения)
    * @param {Array<String>} instThemes массив доп тем для скачивания
    * @param {Array<String>} instStyles массив доп стилей для скачивания
    * @returns {Boolean}
    * @static
    * @public
    * @method
    */
   static isCSSLoaded(themeName?: string, instThemes: string[] = [], instStyles: string[] = []): boolean {
      const themeController = getThemeController();
      const themes = instThemes.concat(this._theme);
      const styles = instStyles.concat(this._styles);
      if (styles.length === 0 && themes.length === 0) {
         return true;
      }
      return themes.every((cssName) => themeController.isMounted(cssName, themeName)) &&
         styles.every((cssName) => themeController.isMounted(cssName, EMPTY_THEME));
   }

   /* End: CSS static region */

   /* Start: React lifecycle hooks */

   componentDidMount(): void {
      if (!this._asyncMount) {
         setTimeout(() => {
            makeRelation(this);
            this._afterMount(this.props);
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
      // FIXME: Удалить проверку на isHydrating при переводе демки на оживление на диве
      if (!this._firstRender && !isHydrating()) {
         this._reactiveStart = false;
         try {
            this._beforeUpdate.apply(this, [this.props]);
         } finally {
            this._reactiveStart = true;
         }
      }
      return null;
   }

   componentWillUnmount(): void {
      removeRelation(this);
      releaseProperties(this);
      this._beforeUnmount.apply(this);
      const isWS3Compatible: boolean = this.hasOwnProperty('getParent');
      if (!isWS3Compatible) {
         const async: boolean = !Purifier.canPurifyInstanceSync(this._moduleName);
         Purifier.purifyInstance(this, this._moduleName, async);
      }
   }

   render(empty?: unknown, attributes?: ITemplateAttrs): string | object {
      if (constants.isServerSide) {
         let markup: string | object = '';
         ReactiveObserver.forbidReactive(this, () => {
            markup = this._getMarkup(null, attributes);
         });
         return markup;
      }

      if (this._firstRender) {
         this.__beforeMount(this.props);
      }

      // @ts-ignore
      window.reactGenerator = true;

      if (this._asyncMount && this.state.loading) {
         if (this._moduleName === 'UI/Base:HTML') {
            return null;
         } else {
            return this._getLoadingComponent();
         }
      }

      if (this._moduleName === 'UI/_base/HTML/Head') {
         // FIXME: Пересоздаем head на клиенте, так как гидрация реакта его стирает
         const newHead = createElement('head', {
            // @ts-ignore
            dangerouslySetInnerHTML: {__html: _innerHeadHtml}
         });
         _innerHeadHtml = null;
         return newHead;
      }

      const generatorConfig = getGeneratorConfig();
      TClosure.setReact(true);

      let res;
      try {
         const ctx = {...this, _options: {...this.props}};
         res = this._template(ctx, {}, undefined, true, undefined, undefined, generatorConfig);
         // прокидываю тут аргумент isCompatible, но можно вынести в builder
         const originRef = res[0].ref;
         // tslint:disable-next-line:no-this-assignment
         const control = this;
         res[0] = {
            ...res[0], ref: (node) => {
               prepareControlNodes(node, control, Control);
               return originRef && originRef.apply(this, [node]);
            }
         };
      } finally {
         TClosure.setReact(false);
      }

      return res[0];

   }

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
   // флаг определяет, что класс является wasaby-контролом, а не ws3
   // используется в шаблонизаторе для определения типа создаваемого контрола для совместимости
   static isWasaby: boolean = true;

   // создание и монтирование контрола в элемент
   // добавляется потому что используемое апи контрола
   static createControl(ctor: TControlConstructor, cfg: IControlOptions, domElement: HTMLElement): void {
      const updateMarkup = isHydrating() ?
         ReactDOM.hydrate :
         ReactDOM.render;

      // FIXME: Кладем в локальную переменную содержимое head для отрисовки его на клиенте после гидрации
      _innerHeadHtml = domElement.getElementsByTagName('head')[0].innerHTML;

      // @ts-ignore
      // проблема что родитель может быть document как сейчас в демке проблема уйдет когда рисовать будем не от html
      updateMarkup(React.createElement(ctor, cfg), domElement.parentNode, function (): void {
         configureControl({
            control: this,
            domElement
         });
      });
   }
}

Object.assign(Control.prototype, {
   _template: template
});

function logError(e: Error): void {
   Logger.error(e.message);
}

const nop = () => undefined;
