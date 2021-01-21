import {Component, createElement} from 'react';
import {reactiveObserve} from './ReactiveObserver';
import {getGeneratorConfig} from './GeneratorConfig';
import {makeRelation, removeRelation} from './ParentFinder';
import {Logger} from 'UI/Utils';
import {_IControl} from 'UI/Focus';
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {ReactiveObserver} from 'UI/Reactivity';
import {createEnvironment} from 'UI/_react/Control/EnvironmentStorage';
import {prepareControlNodes} from './ControlNodes';

// @ts-ignore
import template = require('wml!UI/_react/Control/Compatible');
import {
   IControlChildren,
   IControlOptions,
   IControlState,
   TIState,
   TemplateFunction,
   IDOMEnvironment, ITemplateAttrs, TControlConstructor, IControl
} from './interfaces';

let countInst = 1;

/**
 * Базовый контрол, наследник React.Component с поддержкой совместимости с Wasaby
 * @class UI/ReactComponent/Control
 * @author Mogilevsky Ivan
 * @public
 */
export class Control<TOptions extends IControlOptions = {}, TState extends TIState = void>
   extends Component<TOptions, IControlState> implements _IControl, IControl {
   // флаг показывает что идет первая отрисовка
   private _firstRender: boolean = true;
   // флаг показывает: что идет разрешение асинхронного beforeMount
   private _asyncMount: boolean = false;
   // метод инициализации реактивности
   private _$observer: Function = reactiveObserve;
   // контейнер контрола
   _container: HTMLElement = null;
   // набор детей контрола, элементы или контролы, которым задан атрибут name (является ключом)
   protected _children: IControlChildren = {};
   // шаблон контрола
   protected _template: TemplateFunction;
   // опции контрола (пропсы)
   _options: TOptions = {} as TOptions;
   // флаг показывает, работает ли реактивность у контрола
   _reactiveStart: boolean = false;
   // хранилище значений реактивных полей
   reactiveValues: object;
   // окружение DOMEnvironment контрола
   private _environment: IDOMEnvironment;
   // логический родитель контрола
   _logicParent: IControl;
   // результат выполнения beforeMount
   private _$resultBeforeMount: TState | void;
   // родительский ход (если есть)
   _parentHoc: IControl;
   // название модуля контрола
   _moduleName: string;
   // id контрола
   private readonly _instId: string = 'inst_' + countInst++;

   // конструктор контрола
   constructor(props: TOptions) {
      super(props);
      this._options = props;
      this.state = {
         loading: true
      };
      // @ts-ignore
      this._logicParent = props._logicParent;
   }

   // возвращает id, используется пользователями
   getInstanceId(): string {
      return this._instId;
   }
   // запуск события - сейчас заглушка. удалить нельзя, это самое простое решение
   _notify(eventName: string, args?: unknown[], options?: { bubbling?: boolean }): void {
      // nothing for a while...
   }
   // активация контрола - сейчас заглушка. удалить нельзя, это самое простое решение
   activate(cfg: { enableScreenKeyboard?: boolean, enableScrollToElement?: boolean } = {}): void {
      // nothing for a while...
   }
   // запускает перерисовку
   _forceUpdate(): void {
      this.forceUpdate();
   }
   // сохраняет окружение контрола
   private _saveEnvironment(env: IDOMEnvironment): void {
      this._environment = env;
   }
   // возвращает окружение контрола
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
      if (this._$resultBeforeMount) {
         return this._$resultBeforeMount;
      }

      let savedOptions;
      // @ts-ignore
      const hasCompatible = this.hasCompatible && this.hasCompatible();
      // в совместимости опции добавились и их нужно почистить
      if (hasCompatible) {
         savedOptions = this._options;
         this._options = {} as TOptions;
      }

      const resultBeforeMount = this._beforeMount.apply(this, arguments);

      if (hasCompatible) {
         this._options = savedOptions;
      }

      return this._$resultBeforeMount = resultBeforeMount;
   }
   // точка входа в beforeMount
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
      this._$observer(this, this._template);
   }

   // построение верстки контрола
   _getMarkup(rootKey?: string,
              attributes?: ITemplateAttrs,
              isVdom: boolean = true): string|object {
      // @ts-ignore
      if (!(this._template).stable) {
         Logger.error(`[UI/_base/Control:_getMarkup] Check what you put in _template "${this._moduleName}"`, this);
         return '';
      }
      let res;

      if (!attributes) {
         attributes = {};
      }
      for (const i in attributes.events) {
         if (attributes.events.hasOwnProperty(i)) {
            for (let handl = 0; handl < attributes.events[i].length; handl++) {
               if (
                  attributes.events[i][handl].isControl &&
                  // @ts-ignore
                  !attributes.events[i][handl].fn.controlDestination
               ) {
                  // @ts-ignore
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

   /* Start: React lifecycle hooks */

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
            try {
               this._beforeUpdate.apply(this, [this.props]);
            } finally {
               this._reactiveStart = true;
            }
         }
      }
      return null;
   }

   componentWillUnmount(): void {
      removeRelation(this);
      this._beforeUnmount.apply(this);
   }

   render(attributes?: ITemplateAttrs): string|object {
      if (typeof window === 'undefined') {
         let markup: string | object = '';
         ReactiveObserver.forbidReactive(this, () => {
            markup = this._getMarkup(null, attributes, false);
         });
         return markup;
      }

      if (this._firstRender) {
         this.__beforeMount();
      }

      if (this._asyncMount && this.state.loading) {
         if (this._moduleName === 'UI/Base:HTML') {
            return null;
         } else {
            return this._getLoadingComponent();
         }
      }

      const generatorConfig = getGeneratorConfig();
      // @ts-ignore
      window.reactGenerator = true;
      const ctx = {...this, _options: {...this.props}};
      const res = this._template(ctx, {}, undefined, undefined, undefined, undefined, generatorConfig);
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

      // @ts-ignore
      window.reactGenerator = false;
      return res;
   }

   // для определения что это базовый класс wasaby, а не ws3, используется в генераторах
   static isWasaby: boolean = true;

   // конфигурация созданного контрола
   static configureControl(parameters: {
      control: Control,
      domElement: HTMLElement
   }): void {
      const environment = createEnvironment(parameters.domElement);
      parameters.control._saveEnvironment(environment);
   }

   // создание и монтирование контрола в элемент
   static createControl(ctor: TControlConstructor, cfg: IControlOptions, domElement: HTMLElement): void {
      if (document.documentElement.classList.contains('pre-load')) {
         // @ts-ignore
         ReactDOM.hydrate(React.createElement(ctor, cfg, null), domElement.parentNode, function (): void {
            Control.configureControl({
               control: this,
               domElement
            });
         });
      } else {
         // @ts-ignore
         ReactDOM.render(React.createElement(ctor, cfg, null), domElement.parentNode, function (): void {
            Control.configureControl({
               control: this,
               domElement
            });
         });
      }
   }
}

Object.assign(Control.prototype, {
   _template: template
});
