import {Component, createElement} from 'react';
import {reactiveObserve} from './ReactiveObserver';
import {_IGeneratorType} from 'UI/Executor';
import {getGeneratorConfig} from './GeneratorConfig';
import {makeRelation, removeRelation} from './ParentFinder';
import {Logger} from 'UI/Utils';
import {_IControl} from 'UI/Focus';
import * as ReactDOM from 'react-dom';
import * as React from 'react';

// @ts-ignore
import template = require('wml!UI/_react/Control/Compatible');
import {ReactiveObserver} from 'UI/Reactivity';
import {createEnvironment} from 'UI/_react/Control/EnvironmentStorage';
import {prepareControlNodes} from './ControlNodes';

let countInst = 1;

export type TemplateFunction = (data: any, attr?: any, context?: any, isVdom?: boolean, sets?: any,
                                forceCompatible?: boolean,
                                generatorConfig?: _IGeneratorType.IGeneratorConfig) => string | object;

type IControlChildren = Record<string, Element | Control | Control<IControlOptions, {}>>;

interface IControlState {
   loading: boolean;
}

type TIState = void | {};

export interface IControlOptions {
   readOnly?: boolean;
   theme?: string;
}

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
   _container: HTMLElement = null;
   protected _children: IControlChildren = {};
   protected _template: TemplateFunction;
   protected _options: TOptions = {} as TOptions;
   _reactiveStart: boolean = false;
   reactiveValues: object;

   private _environment: any;
   _logicParent: any;
   private _$resultBeforeMount: any;
   _parentHoc: any;

   private readonly _instId: string = 'inst_' + countInst++;

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

   _notify(eventName: string, args?: unknown[], options?: { bubbling?: boolean }): void {
      // nothing for a while...
   }

   activate(cfg: { enableScreenKeyboard?: boolean, enableScrollToElement?: boolean } = {}): void {
      // nothing for a while...
   }

   _forceUpdate(): void {
      this.forceUpdate();
   }

   private _saveEnvironment(env: unknown): void {
      this._environment = env;
   }

   _getEnvironment(): any {
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

   __beforeMountSSR(options?: TOptions,
                    contexts?: object,
                    receivedState?: TState): Promise<TState | void> | void {
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

   _getMarkup(rootKey?: string,
              attributes?: any,
              isVdom: boolean = true): any {

      if (!(this._template as any).stable) {
         // @ts-ignore
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

   // На данном этапе рисуем индикатор вместо компонента в момент загрузки асинхронного beforeMount
   private _getLoadingComponent(): any {
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

   render(empty?: any, attributes?: any): unknown {
      if (typeof window === 'undefined') {
         let markup;
         ReactiveObserver.forbidReactive(this, () => {
            markup = this._getMarkup(null, attributes, false);
         });
         return markup;
      }

      if (this._firstRender) {
         this.__beforeMount();
      }

      // @ts-ignore
      if (this._asyncMount && this.state.loading) {
         // @ts-ignore
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
      // @ts-ignore
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

   static configureControl(parameters: {
      control: Control,
      domElement: HTMLElement
   }): void {
      const environment = createEnvironment(parameters.domElement);
      parameters.control._saveEnvironment(environment);
   }

   static createControl(ctor: any, cfg: any, domElement: HTMLElement): void {
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
