/* tslint:disable */

// @ts-ignore
import template = require('wml!UI/_base/Control');

import { Synchronizer } from 'Vdom/Vdom';
import { OptionsResolver } from 'View/Executor/Utils';
import { Focus, ContextResolver } from 'View/Executor/Expressions';
import { activate } from 'UI/Focus';
import { Logger, Purifier } from 'UI/Utils';
import { constants } from 'Env/Env';

import { getThemeController, EMPTY_THEME } from 'UI/theme/controller';
// @ts-ignore
import PromiseLib = require('Core/PromiseLib/PromiseLib');
// @ts-ignore
import ReactiveObserver = require('Core/ReactiveObserver');

import * as Expressions from 'View/Executor/Expressions';
import * as Utils from 'View/Executor/Utils';
import * as Markup from 'View/Executor/Markup';
import * as Vdom from 'Vdom/Vdom';
import * as DevtoolsHook from 'Vdom/DevtoolsHook';
import * as FocusLib from 'UI/Focus';
import startApplication from 'UI/_base/startApplication';
import { headDataStore } from 'UI/_base/HeadData';

// @ts-ignore
import * as Hydrate from 'Inferno/third-party/hydrate';

if (Hydrate.initInferno) {
   Hydrate.initInferno(Expressions, Utils, Markup, Vdom, FocusLib, DevtoolsHook);
}

export type TemplateFunction = (data: any, attr?: any, context?: any, isVdom?: boolean, sets?: any) => string;

type IControlChildren = Record<string, Element | Control>;

/**
 * @event UI/_base/Control#activated Происходит при активации контрола.
 * @param {Boolean} isTabPressed Указывает, был ли активирован контрол нажатием на клавишу Tab.
 * @param {Boolean} isShiftKey Указывает, был ли активирован контрол нажатием Tab+Shift.
 * @remark Контрол активируется, когда на один из его DOM-элементов переходит фокус.
 * Подробное описание и примеры использования события читайте
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ здесь}.
 * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/
 * @see deactivated
 */

/*
 * @event UI/_base/Control#activated Occurs when the component becomes active.
 * @param {Boolean} isTabPressed Indicates whether control was activated by Tab press.
 * @remark Control is activated when one of its DOM elements becomes focused. Detailed description and u
 * se cases of the event can be found
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
 * @see Documentation: Activation system
 * @see deactivated
 */

/**
 * @event UI/_base/Control#deactivated Происходит при деактивации контрола.
 * @param {Boolean} isTabPressed Указывает, был ли деактивирован контрол нажатием на клавишу Tab.
 * @remark Контрол перестает быть активным, когда все его дочерние контролы теряют фокус.
 * Подробное описание и примеры использования события читайте
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/ здесь}.
 * @see activated
 */

/*
 * @event UI/_base/Control#deactivated Occurs when control becomes inactive.
 * @param {Boolean} isTabPressed Indicates whether control was deactivated by Tab press.
 * @remark Control is deactivated when all of its child component lose focus.
 * Detailed description and use cases of the event can be found
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
 * @see Documentation: Activation system
 * @see activated
 */

let countInst = 1;

// tslint:disable-next-line
const EMPTY_FUNC = function () { };

const BL_MAX_EXECUTE_TIME = 5000;
const CONTROL_WAIT_TIMEOUT = 20000;

const WAIT_TIMEOUT = 20000;
// This timeout is needed for loading control css.
// If we can not load css file we want to continue building control without blocking it by throwing an error.
// IE browser only needs more than 5 sec to load so we increased timeout up to 30 sec.
const WRAP_TIMEOUT = 30000;

const stateNamesNoPurify = {
    isDestroyed: true
};

export const _private = {
   _checkAsyncExecuteTime: function (startTime: number, customBLExecuteTime: number, moduleName: string): void {
      let executeTime = Date.now() - startTime;
      customBLExecuteTime = customBLExecuteTime ? customBLExecuteTime : BL_MAX_EXECUTE_TIME;
      if (executeTime > customBLExecuteTime) {
         const message = `Долгое выполнение _beforeMount на клиенте! 
            Promise, который вернули из метода _beforeMount контрола ${moduleName} ` +
            `завершился за ${executeTime} миллисекунд. 
            Необходимо: 
            - ускорить работу БЛ или
            - перенести работу в _afterMount контрола ${moduleName} или
            - увеличить константу ожидания по согласованию с Бегуновым А. ` +
            `прикреплять согласование комментарием к константе, чтобы проект прошел ревью`;
         Logger.warn(message, this);
      }
   },

   _asyncClientBeforeMount: function<TState>(resultBeforeMount: Promise<void | TState>, time: number, customBLExecuteTime: number, moduleName: string): Promise<void | TState> | boolean {
      let startTime = Date.now();

      let asyncTimer = setTimeout(() => {
         const message = `Ошибка построения на клиенте! 
            Promise, который вернули из метода _beforeMount контрола ${moduleName} ` +
            `не завершился за ${time} миллисекунд. 
            Необходимо проверить правильность написания асинхронных вызовов в _beforeMount контрола ${moduleName}.
            Возможные причины:
            - Promise не вернул результат/причину отказа
            - Метод БЛ выполняется более 20 секунд`;
         Logger.error(message, this);
      }, time);

      return resultBeforeMount.finally(() => {
            clearTimeout(asyncTimer);
            _private._checkAsyncExecuteTime(startTime, customBLExecuteTime, moduleName);
         }
      );
   },

   _checkBeforeUnmount: function(control): void {
      if (control.hasCompatible() && control.isDestroyed()) {
         Logger.warn('Флаг _isDestroyed был изменен до разрушения контрола', control);
      }
   }
};

const themeController = getThemeController();

export interface IControlOptions {
   readOnly?: boolean;
   theme?: string;
}
/**
 * @class UI/_base/Control
 * @author Шипин А.А.
 * @remark {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/compound-wasaby/#corecreator Asynchronous creation of Core/Creator component}
 * @ignoreMethods isBuildVDom isEnabled isVisible _getMarkup
 * @public
 */
export default class Control<TOptions extends IControlOptions = {}, TState = void> {
   protected _moduleName: string;

   private _mounted: boolean = false;
   private _unmounted: boolean = false;
   private _destroyed: boolean = false;
   private _$active: boolean = false;
   private _reactiveStart: boolean = false;

   private readonly _instId: string;
   protected _options: TOptions = null;
   private _internalOptions: Record<string, unknown> = null;

   private _context: any = null;
   private context: any = null;
   private saveFullContext: any = null;
   private _saveContextObject: any = null;
   private _$resultBeforeMount: any = null;

   private _saveEnvironment: Function = null;
   private saveInheritOptions: Function = null;
   private _getEnvironment: Function = null;

   protected _notify: (eventName: string, args?: unknown[], options?: { bubbling?: boolean }) => unknown = null;
   protected _template: TemplateFunction;
   protected _clientTimeout: number = null;

   // protected for compatibility, should be private
   protected _container: HTMLElement = null;

   // TODO: Временное решение. Удалить после выполнения удаления всех использований.
   // Ссылка: https://online.sbis.ru/opendoc.html?guid=5f576e21-6606-4a55-94fd-6979c6bfcb53.
   private _logicParent: Control<TOptions, void> = null;

   // Render function for virtual dom
   _getMarkup: Function = null;
   // Render function for text generator
   render: Function = null;

   protected _children: IControlChildren = null;

   constructor(cfg: any) {
      if (!cfg) {
         cfg = {};
      }

      /**
       * TODO: delete it
       */
      let fullContext = null;
      let _contextObj = null;

      this.saveFullContext = (ctx) => {
         fullContext = ctx;
      };

      this._saveContextObject = (ctx) => {
         _contextObj = ctx;
         this._context = ctx;
      };
      this.context = {
         get(field: string): Record<string, unknown> {
            if (_contextObj && _contextObj.hasOwnProperty(field)) {
               return _contextObj[field];
            }
            return null;
         },
         set(): void {
            throw new Error("Can't set data to context. Context is readonly!");
         },
         has(): boolean {
            return true;
         }
      };

      /**
       * end todo
       */

      let controlNode = null;
      let savedInheritOptions = null;
      let environment = null;

      this.saveInheritOptions = (opts: any) => {
         savedInheritOptions = opts;
      };

      this._saveEnvironment = (env, cntNode) => {
         controlNode = cntNode;
         environment = env;
      };

      // сделано так чтобы были доступны замыкания
      this._getEnvironment = () => {
         return environment;
      };

      // tslint:disable-next-line:only-arrow-functions
      this._notify = function (): any {
         return environment && environment.startEvent(controlNode, arguments);
      };

      // @ts-ignore
      this._notify._isVdomNotify = true;

      // сделано так чтобы были доступны замыкания
      this._forceUpdate = () => {
         const control = this || (controlNode && controlNode.control);
         if (control && !control._mounted) {
            // _forceUpdate was called asynchronous from _beforeMount before control was mounted to DOM
            // So we need to delay _forceUpdate till the moment component will be mounted to DOM
            control._$needForceUpdate = true;
         } else {
            if (environment) {
               // This is fix for specific case. When environment has _haveRebuildRequest and after that
               // we creating another one. We don't have to do that, it's better to delay rebuild, after current
               // sync cycle.
               // after 410 condition "control._moduleName === 'FED2/UI/DocumentCompatible'" will be deleted.
               if (environment._haveRebuildRequest && control._moduleName === 'FED2/UI/DocumentCompatible') {
                  control._$needForceUpdate = true;
               } else {
                  environment.forceRebuild(controlNode.id);
               }

            }
         }
      };

      /**
       * Метод, который возвращает разметку для компонента
       * @param rootKey
       * @param isRoot
       * @param attributes
       * @param isVdom
       * @returns {*}
       */
      this._getMarkup = function _getMarkup(
         rootKey?: string,
         isRoot?: boolean,
         attributes?: object,
         isVdom: boolean = true
      ): any {
         if (!this._template.stable) {
            Logger.error(`[UI/_base/Control:_getMarkup] Check what you put in _template "${this._moduleName}"`, this);
            return '';
         }
         let res;

         if (!attributes) {
            attributes = {};
         }
         attributes.context = fullContext;
         attributes.inheritOptions = savedInheritOptions;
         for (const i in attributes.events) {
            if (attributes.events.hasOwnProperty(i)) {
               for (let handl = 0; handl < attributes.events[i].length; handl++) {
                  if (
                     attributes.events[i][handl].fn.isControlEvent &&
                     !attributes.events[i][handl].fn.controlDestination
                  ) {
                     attributes.events[i][handl].fn.controlDestination = this;
                  }
               }
            }
         }
         res = this._template(this, attributes, rootKey, isVdom);
         if (res) {
            if (isVdom) {
               if (res.length !== 1) {
                  const message = `There should be only one root element in control markup. Got ${res.length} root(s).`;
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
      };

      this.render = function (empty?: any, attributes?: any): any {
         const markup = this._getMarkup(null, true, attributes, false);
         this._isRendered = true;
         return markup;
      };
      if (cfg._logicParent && !(cfg._logicParent instanceof Control)) {
         Logger.error('Option "_logicParent" is not instance of "Control"', this);
      }
      this._logicParent = cfg._logicParent;
      this._options = {};
      this._internalOptions = {};
      this._children = {};
      this._instId = 'inst_' + countInst++;

      /*dont use this*/
      if (this._afterCreate) {
         this._afterCreate(cfg);
      }
   }

   /**
    * Запускает цикл обновления контрола вручную.
    *
    * @remark Обновление контрола запускается автоматически при подписке на DOM-события и события контролов из шаблона.
    * Если состояние контрола обновляется в другое время (тайм-аут или подписка на событие сервера), необходимо запустить обновление вручную.
    * После _forceUpdate будут вызваны все хуки жизненного цикла обновления (_shouldUpdate, _beforeUpdate, _afterUpdate).
    * @example
    * В этом примере при получении нового состояния от сервера вызывается обработчик _statusUpdatedHandler.
    * Затем вы обновляете состояние с этим статусом и вручную запускаете обновление контрола для отображения его шаблона.
    * <pre>
    *    Control.extend({
    *       ...
    *       _statusUpdatedHandler(newStatus) {
    *          this._status = newStatus;
    *          this._forceUpdate();
    *       }
    *       ...
    *    });
    * </pre>
    * @see Documentation: Control lifecycle
    * @private
    */

   /*
    * Manually triggers start of the update cycle for the control.
    *
    * @remark Control's update starts automatically when you subscribe to DOM and control events from the
    * template. If you update control's state at some other time (timeout or subscription to server event),
    * you need to start update manually. After _forceUpdate, all hooks from update lifecycle will be called
    * (_shouldUpdate, _beforeUpdate, _afterUpdate).
    * @example
    * In this example, _statusUpdatedHandler is called when new status received from server.
    * You then update the state with this status and manually trigger control's update to rerender its' template.
    * <pre>
    *    Control.extend({
    *       ...
    *       _statusUpdatedHandler(newStatus) {
    *          this._status = newStatus;
    *          this._forceUpdate();
    *       }
    *       ...
    *    });
    * </pre>
    * @see Documentation: Control lifecycle
    * @private
    */
   _forceUpdate(): void {
      // будет переопределено в конструкторе, чтобы был доступ к замыканиям
   }

   getInstanceId(): string {
      return this._instId;
   }

   mountToDom(element: HTMLElement, cfg: any, controlClass: Control): void {
      // @ts-ignore
      if (!this.VDOMReady) {
         // @ts-ignore
         this.VDOMReady = true;
         this._container = element;
         // @ts-ignore
         Synchronizer.mountControlToDOM(this, cfg, this._container, this._decOptions);
      }
      if (cfg) {
         this.saveOptions(cfg);
      }
   }

   // Just save link to new options
   saveOptions(options: TOptions, controlNode: any = null): boolean {
      this._options = options;
      if (controlNode) {
         this._container = controlNode.element;
      }
      return true;
   }

   /**
    * Метод задания значения служебной опции
    * @param {string} name Имя служебной опции
    * @param {*} value Значение опции
    */
   private _setInternalOption(name: string, value: unknown): void {
      if (!this._internalOptions) {
         this._internalOptions = {};
      }
      this._internalOptions[name] = value;
   }

   /**
    * Метод задания служебных опций
    * @param {Object} internal Объект, содержащий ключи и значения устанавливаемых служебных опций
    */
   _setInternalOptions(internal: Record<string, unknown>): void {
      for (const name in internal) {
         if (internal.hasOwnProperty(name)) {
            this._setInternalOption(name, internal[name]);
         }
      }
   }


   destroy(): void {
      this._destroyed = true;

      // освобождаем сложные реактивные свойства, чтобы их вновь можно было регистрировать как реактивные
      // для других экземпляров
      ReactiveObserver.releaseProperties(this);

      try {
         const contextTypes = this.constructor.contextTypes ? this.constructor.contextTypes() : {};
         for (const i in contextTypes) {
            // Need to check if context field actually exists.
            // Because context field can be described in contextTypes but not provided by parent of the control.
            if (contextTypes.hasOwnProperty(i) && this.context.get(i) instanceof contextTypes[i]) {
               this.context.get(i).unregisterConsumer(this);
            }
         }
         if (this._mounted) {
            this.__beforeUnmount();
            (this as any).unmountCallback && (this as any).unmountCallback();
            Synchronizer.cleanControlDomLink(this._container, this);
         }
         // Избегаем утечки контролов по замыканию
         //this.saveFullContext = EMPTY_FUNC;
         //this._saveContextObject = EMPTY_FUNC;
         //this.saveInheritOptions = EMPTY_FUNC;
         //this._saveEnvironment = EMPTY_FUNC;
         //this._getEnvironment = EMPTY_FUNC;
         //this._notify = EMPTY_FUNC;
         this._forceUpdate = EMPTY_FUNC;
         this._beforeUnmount = EMPTY_FUNC;
         //this._getMarkup = EMPTY_FUNC;
      } catch (error) {
         Logger.lifeError('_beforeUnmount', this, error);
      }
      Purifier.purifyInstance(this, this._moduleName, true, stateNamesNoPurify);
   }

   // <editor-fold desc="API">

   _blur(): void {
      const container = this._container;
      const activeElement = document.activeElement;
      let tmpTabindex;

      if (!container.contains(document.activeElement)) {
         return;
      }

      // задача - убрать фокус с текущего элемента. куда? ну, например на body
      // чтобы можно было перевести фокус на body, сначала выставим табиндекс, а потом уберем
      if (document.body.tabIndex === -1) {
         tmpTabindex = document.body.tabIndex;
         document.body.tabIndex = 1;
      }
      document.body.focus();
      if (this._$active) {
         const env = this._getEnvironment();

         // если DOMEnvironment не перехватил переход фокуса, вызовем обработчик ухода фокуса вручную
         env._handleFocusEvent({ target: document.body, relatedTarget: activeElement });
      }

      if (tmpTabindex !== undefined) {
         document.body.tabIndex = tmpTabindex;
      }
   }

   /**
    * Активирует контрол.
    * @returns {Boolean} True - когда фокус был установлен успешно, false - когда фокус не установлен.
    * @example
    * В следующем примере показано, как активировать ввод при нажатии кнопки.
    * <pre>
    *    Control.extend({
    *       ...
    *       _clickHandler() {
    *          this._children.textInput.activate();
    *       }
    *       ...
    *    });
    * </pre>
    *
    * <pre>
    *    <div>
    *       <Button on:click="_clickHandler()" />
    *       <Controls.Input.Text name="textInput" />
    *    </div>
    * </pre>
    * @param {Object} cfg Объект, содержащий параметры этого метода.
    * Используйте параметр enableScreenKeyboard = true на устройствах с экранной клавиатурой, фокус будет установлен на поле ввода и экранная клавиатура будет отображена.
    * Используйте параметр enableScreenKeyboard = false, фокус будет установлен на родительском элементе, а не на полях ввода.
    * @remark Метод находит DOM-элемент внутри контрола (и его дочерних контролов), который может быть сфокусирован и устанавливает на него фокус.
    * Метод возвращает true, если фокус был установлен успешно, false - если фокус не был установлен.
    * Когда контрол становится активным, все его дочерние контролы также становятся активными. Когда контрол активируется, он запускает событие активации.
    * Подробное описание и инструкцию по работе с методом читайте
    * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/ здесь}.
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/
    * @see activated
    * @see deactivated
    */

   /*
    * Activates the control.
    * @returns {Boolean} True - when focus was set successfully, false - when nothing was focused.
    * @example
    * The following example shows how to activate input on button click.
    * <pre>
    *    Control.extend({
    *       ...
    *       _clickHandler() {
    *          this._children.textInput.activate();
    *       }
    *       ...
    *    });
    * </pre>
    *
    * <pre>
    *    <div>
    *       <Button on:click="_clickHandler()" />
    *       <Controls.Input.Text name="textInput" />
    *    </div>
    * </pre>
    * @param {Object} cfg Object containing parameters of this method
    * Using of parameter enableScreenKeyboard = true on devices with on-screen keyboard, method will focus input
    * fields and try to show screen keyboard.
    * Using of parameter enableScreenKeyboard = false, method will focus not input fields but parent element.
    * @remark Method finds DOM element inside the control (and its child controls) that can be focused and
    * sets focus on it. Returns true if focus was set successfully and false if nothing was focused.
    * When control becomes active, all of its child controls become active too. When control activates,
    * it fires activated event. Detailed description of the activation algorithm can be found
    * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
    * @see Documentation: Activation system
    * @see activated
    * @see deactivated
    */
   activate(cfg: { enableScreenKeyboard?: boolean, enableScrollToElement?: boolean } = {}): boolean {
      const container = this._container;
      const activeElement = document.activeElement;
      // проверим не пустой ли контейнер, например в случае CompaundContainer'а, видимость которого зависит от условия
      const res = container && activate(container, cfg);

      // может случиться так, что на focus() сработает обработчик в DOMEnvironment,
      // и тогда тут ничего не надо делать
      // todo делать проверку не на _$active а на то, что реально состояние изменилось.
      // например переходим от компонента к его предку, у предка состояние не изменилось.
      // но с которого уходили у него изменилось
      if (res && !this._$active) {
         const env = this._getEnvironment();
         env._handleFocusEvent({ target: document.activeElement, relatedTarget: activeElement });
      }

      return res;
   }

   _afterCreate(cfg: any): void {
      // can be overridden
   }

   /**
    * Хук жизненного цикла контрола. Вызывается непосредственно перед установкой контрола в DOM-окружение.
    *
    * @param {Object} options Опции контрола.
    * @param {Object} contexts Поля контекста, запрошенные контролом.
    * @param {Object} receivedState Данные, полученные посредством серверного рендеринга.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeMount(options, context, receivedState) {
    *          if (receivedState) {
    *             this.employeeName = receivedState;
    *          } else {
    *             return EmployeeNameSource.query().addCallback(function(employeeName) {
    *                this.employeeName = employeeName;
    *                return employeeName;
    *             });
    *          }
    *       }
    *       ...
    *    });
    * </pre>
    * @remark
    * Первый хук жизненного цикла контрола и единственный хук, который вызывается как на стороне сервера, так и на стороне клиента.
    * Он вызывается до рендеринга шаблона, поэтому обычно используется для подготовки данных для шаблона.
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */

   /*
    * Control’s lifecycle hook. Called right before the mounting of the component to DOM.
    *
    * @param {Object} options Control's options.
    * @param {Object} contexts Context fields that controls requested. See "Context in Wasaby controls".
    * @param {Object} receivedState Data received from server render. See "Server render in Wasaby controls".
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeMount(options, context, receivedState) {
    *          if (receivedState) {
    *             this.employeeName = receivedState;
    *          } else {
    *             return EmployeeNameSource.query().addCallback(function(employeeName) {
    *                this.employeeName = employeeName;
    *                return employeeName;
    *             });
    *          }
    *       }
    *       ...
    *    });
    * </pre>
    * @remark This is the first lifecycle hook of the control and the only hook
    * that is called on both server and client side. It is called before template is render, thus
    * it is usually used to prepare data for template. Detailed description of lifecycle hooks can be found here.
    * @see Documentation: Control lifecycle
    * @see Documentation: Options
    * @see Documentation: Context
    * @see Documentation: Server render
    */
   protected _beforeMount(options?: TOptions, contexts?: object, receivedState?: TState): Promise<TState> |
      Promise<void> | void {
      return undefined;
   }

   private _resultBeforeMount(resultBeforeMount: Promise<void | TState>, time: number): Promise<void | TState> | Promise<void> | void {
      return new Promise((resolve, reject) => {
         let timeout = 0;
         resultBeforeMount.then(
             (result) => {
                if (!timeout) {
                   timeout = 1;
                   resolve(result);
                }
                return result;
             },
             (error) => {
                if (!timeout) {
                   timeout = 1;
                   reject(error);
                }
                return error;
             }
         );
         if (time === 0){
            return resolve(false);
         }
         setTimeout(() => {
            if (!timeout) {
               /* Change _template and _afterMount
               *  if execution was longer than 2 sec
               */
               const message = `Promise, который вернули из метода _beforeMount контрола ${this._moduleName} ` +
                  `не завершился за ${time} миллисекунд. ` +
                   `Шаблон контрола не будет построен на сервере.`
               Logger.warn(message, this);

               timeout = 1;
               resolve(false);
               // @ts-ignore
               require(['View/Executor/TClosure'], (thelpers) => {
                  // @ts-ignore
                  this._originTemplate = this._template;
                  // @ts-ignore
                  this._template = function (
                      data: any,
                      attr: any,
                      context: any,
                      isVdom: boolean,
                      sets: any
                  ): any {
                     return template.apply(this, arguments);
                  };
                  // @ts-ignore
                  this._template.stable = true;

                  // tslint:disable-next-line:only-arrow-functions
                  this._afterMount = function (): void {
                     // can be overridden
                  };
               });
            }
         }, time);
      });
   }

   /**
    * хук должен ограничивать асинхронное построение 20-ю секундами (устанавливается в HeadData).
    * вызывается он в процессе генерации верстки
    * @author Тэн В.А.
    */
   _beforeMountLimited(opts: TOptions): Promise<TState> | Promise<void> | void {
      if (this._$resultBeforeMount) {
         return this._$resultBeforeMount;
      }

      // включаем реактивность свойств, делаем здесь потому что в constructor рано, там еще может быть не
      // инициализирован _template, например если нативно объявлять класс контрола в typescript и указывать
      // _template на экземпляре, _template устанавливается сразу после вызова базового конструктора
      ReactiveObserver.observeProperties(this);

      let resultBeforeMount = this._beforeMount.apply(this, arguments);

      // prevent start reactive properties if beforeMount return Promise.
      // Reactive properties will be started in Synchronizer
      if (resultBeforeMount && resultBeforeMount.callback) {
         //start server side render
          // todo проверка на сервис представления
         if (typeof process !== 'undefined' && !process.versions) {
            let time = WAIT_TIMEOUT;
            try {
               time = headDataStore.read('ssrTimeout');
            }
            catch (e) {

            }
            resultBeforeMount = this._resultBeforeMount(resultBeforeMount, time);
         }
         resultBeforeMount.then(() => {
            this._reactiveStart = true;
         }). catch (() => {});

         //start client render
         if (typeof window !== 'undefined') {
            let clientTimeout = this._clientTimeout ? (this._clientTimeout > CONTROL_WAIT_TIMEOUT ? this._clientTimeout : CONTROL_WAIT_TIMEOUT) : CONTROL_WAIT_TIMEOUT;
            _private._asyncClientBeforeMount(resultBeforeMount, clientTimeout, this._clientTimeout, this._moduleName);
         }
      } else {
         // _reactiveStart means starting of monitor change in properties
         this._reactiveStart = true;
      }
      const cssLoading = Promise.all([this.loadThemes(opts.theme), this.loadStyles()]);
      if (constants.isServerSide || this.isDeprecatedCSS() || this.isCSSLoaded(opts.theme)) {
         return this._$resultBeforeMount = resultBeforeMount;
      }
      return this._$resultBeforeMount = cssLoading.then(() => resultBeforeMount);
   }

   //#region CSS private
   private isDeprecatedCSS(): boolean {
      // @ts-ignore
      const isDeprecatedCSS = !!(this._theme && !(this._theme instanceof Array) || this._styles && !(this._styles instanceof Array));
      if (isDeprecatedCSS) {
         Logger.error("Стили и темы должны перечисляться в статическом свойстве класса " + this._moduleName);
      }
      return isDeprecatedCSS;
   }
   private isCSSLoaded(themeName?: string): boolean {
      // @ts-ignore
      const themes = this._theme instanceof Array ? this._theme : [];
      // @ts-ignore
      const styles = this._styles instanceof Array ? this._styles : [];
      return this.constructor['isCSSLoaded'](themeName, themes, styles);
   }
   private loadThemes(themeName?: string): Promise<void> {
      // @ts-ignore
      const themes = this._theme instanceof Array ? this._theme : [];
      return this.constructor['loadThemes'](themeName, themes).catch(logError);
   }
   private loadStyles(): Promise<void> {
       // @ts-ignore
       const styles = this._styles instanceof Array ? this._styles : [];
      return this.constructor['loadStyles'](styles).catch(logError);
   }
   //#endregion
   /**
    * Хук жизненного цикла контрола. Вызывается сразу после установки контрола в DOM-окружение.
    * @param {Object} options Опции контрола.
    * @param {Object} context Поле контекста, запрошенное контролом.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeMount(options, context) {
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

   /*
    * Control’s lifecycle hook. Called right after component was mounted to DOM.
    * @param {Object} options Control's options.
    * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls."
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeMount(options, context) {
    *          this.subscribeToServerEvents();
    *          this.buttonHeight = this._children.myButton.offsetHeight;
    *       }
    *       ...
    *    });
    * </pre>
    * @remark This is the first lifecycle hook called after control was mounted to DOM.
    * At this stage, you can access options and context at this._options and this._context.
    * This hook is frequently used to access DOM elements and to subscribe to server events.
    * Detailed description of lifecycle hooks can be found here.
    * @see Documentation: Control lifecycle
    * @see Documentation: Options
    * @see Documentation: Context
    * @see Documentation: Server render
    */
   protected _afterMount(options?: TOptions, contexts?: any): void {
      // Do
   }

   __beforeUpdate(newOptions: TOptions): void {
      if (newOptions.theme !== this._options.theme) {
         this.loadThemes(newOptions.theme);
      }
      this._beforeUpdate.apply(this, arguments);
   }
   /**
    * Хук жизненного цикла контрола. Вызывается перед обновлением контрола.
    *
    * @param {Object} newOptions Опции, полученные контролом. Устаревшие опции можно найти в this._options.
    * @param {Object} newContext Контекст, полученный контролом. Устаревшие контексты можно найти в this._context.
    * @remark В этом хуке вы можете сравнить новые и старые опции и обновить состояние контрола.
    * В этом хуке, также, вы можете подготовить все необходимое для визуализации шаблона контрола. Часто код в этом блоке схож с кодом в хуке _beforeMount.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeUpdate(newOptions, newContext) {
    *
    *          // Update control's state before template is rerendered.
    *          this.userName = newOptions.firstName + ' ' + newOptions.lastName;
    *          if (newOptions.salary !=== this._options.salary) {
    *             this._recalculateBenefits(newOptions.salary);
    *          }
    *       }
    *       ...
    *    });
    * </pre>
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */

   /*
    * Control’s lifecycle hook. Called before update of the control.
    *
    * @param {Object} newOptions Options that control received. Old options can be found in this._options.
    * @param {Object} newContext Context that control received. Old context can be found in this._context.
    * @remark In this hook you can compare new and old options and update state of the control.
    * In this hook you would prepare everything needed for control's template render. Frequently,
    * the code in this hook will be similar to code in _beforeMount hook.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeUpdate(newOptions, newContext) {
    *
    *          // Update control's state before template is rerendered.
    *          this.userName = newOptions.firstName + ' ' + newOptions.lastName;
    *          if (newOptions.salary !=== this._options.salary) {
    *             this._recalculateBenefits(newOptions.salary);
    *          }
    *       }
    *       ...
    *    });
    * </pre>
    * @see Documentation: Control lifecycle.
    * @see Documentation: Options.
    * @see Documentation: Context.
    */
   protected _beforeUpdate(options?: TOptions, contexts?: any): void {
      // Do
   }

   /**
    * Определяет, должен ли контрол обновляться. Вызывается каждый раз перед обновлением контрола.
    *
    * @param {Object} options Опции контрола.
    * @param {Object} context Поле контекста, запрошенное контролом.
    * @returns {Boolean}
    * <ol>
    *    <li>true(значание по умолчанию): контрол будет обновлен.</li>
    *    <li>false: контрол не будет обновлен. Хук _afterUpdate не будет вызван.</li>
    * </ol>
    * @example
    * Например, если employeeSalary является единственным параметром, используемым в шаблоне контрола,
    * можно обновлять контрол только при изменении параметра employeeSalary.
    * <pre>
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

   /*
    * Determines whether control should update. Called every time before control update.
    *
    * @param {Object} newOptions Options that control received. Old options can be found in this._options.
    * @param {Object} newContext Context that control received. Old context can be found in this._context.
    * @returns {Boolean}
    * <ol>
    *    <li>true(default): control will update.</li>
    *    <li>false: control won't update. _afterUpdate hook won't be called.</li>
    * </ol>
    * @example
    * For example, if employeeSalary if the only option used in control's template, you can tell the control
    * to update only if employeeSalary option changes.
    * <pre>
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
    * @remark The hook is called after _beforeUpdate hook before templating engine's rebuild of the control.
    * This hook can be used for optimizations. You can compare new and current options and return false if
    * there is no need to recalculate control's DOM tree.
    * @see Documentation: Control lifecycle
    * @see Documentation: Options
    * @see Documentation: Context
    * @see Documentation: Server render
    */
   protected _shouldUpdate(options: TOptions, context: any): boolean {
      return true;
   }

   /**
    * Хук жизненного цикла контрола. Вызывается синхронно после применения измененной верстки контрола.
    *
    * @param {Object} oldOptions Опции контрола до обновления.
    * Текущие опции можно найти в this._options.
    * @param {Object} oldContext Контекст контрола до обновления.
    * Текущий контекст можно найти в this._context.
    * @remark На этом этапе вы получаете доступ к отрисованной верстке.
    * Жизненный хук используется в случае, если не подходит _afterUpdate для некоторых ускорений.
    * Например, если после отрисовки необходимо выполнить корректировку положения скролла (вовзрат на прежнее положение),
    * это нужно делать синхронно после отрисовки, чтобы не было видно прыжка.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _afterRender() {
    *
    *          // Accessing DOM elements to some fix after render.
    *          this._container.scrollTop = this._savedScrollTop;
    *       }
    *       ...
    *    });
    * </pre>
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */
   protected _afterRender(oldOptions?: TOptions, oldContext?: any): void {
      // Do
   }

   /**
    * Хук жизненного цикла контрола. Вызывается после обновления контрола.
    *
    * @param {Object} oldOptions Опции контрола до обновления.
    * Текущие опции можно найти в this._options.
    * @param {Object} oldContext Контекст контрола до обновления.
    * Текущий контекст можно найти в this._context.
    * @remark Этот хук жизненного цикла вызывается после обновления DOM-контрола.
    * На этом этапе вы получаете доступ к дочерним контролам и взаимодействуете с DOM-окружением.
    * Часто код в этом хуке схож с кодом в хуке _afterMount.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _afterUpdate(oldOptions, oldContext) {
    *
    *          // Accessing DOM elements to update control's state.
    *          this.buttonHeight = this._children.myButton.offsetHeight;
    *       }
    *       ...
    *    });
    * </pre>
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */

   /*
    * Control’s lifecycle hook. Called after control was updated.
    *
    * @param {Object} oldOptions Options that control had before the update.
    * Current options can be found in this._options.
    * @param {Object} oldContext Context that control had before the update.
    * Current context can be found in this._context.
    * @remark This lifecycle hook called after control's DOM was updated. At this stage you access
    * control's children and interact with DOM. Frequently, the code in this hook will
    * be similar to code in _afterMount hook.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _afterUpdate(oldOptions, oldContext) {
    *
    *          // Accessing DOM elements to update control's state.
    *          this.buttonHeight = this._children.myButton.offsetHeight;
    *       }
    *       ...
    *    });
    * </pre>
    * @see Documentation: Control lifecycle
    * @see Documentation: Options
    * @see Documentation: Context
    */
   protected _afterUpdate(oldOptions?: TOptions, oldContext?: any): void {
      // Do
   }

   __beforeUnmount(): void {
      this._beforeUnmount.apply(this, arguments);
      _private._checkBeforeUnmount(this);
   }

   /**
    * Хук жизненного цикла контрола. Вызывается до удаления контрола.
    * @remark Это последний хук жизненного цикла контрола. Контрол не будет существовать после вызова этого хука.
    * Его можно использовать для отмены подписки на события сервера и очистки всего, что было сохранено в памяти.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeUnmount() {
    *          this._unsubscribeFromMyEvents();
    *       }
    *       ...
    *    });
    * </pre>
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */

   /*
    * Control’s lifecycle hook. Called before the destruction of the control.
    * @remark This is the last hook of the control's lifecycle. Control will no exist after this hook.
    * It can be used to unsubscribe from server events and clean up anything that was stored in memory.
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *       _beforeUnmount() {
    *          this._unsubscribeFromMyEvents();
    *       }
    *       ...
    *    });
    * </pre>
    * @see Documentation: Control lifecycle
    * @see Documentation: Options
    * @see Documentation: Context
    */
   protected _beforeUnmount(): void {
      // Do
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
   static isWasaby: boolean = true;

   //#region CSS static
   /**
    * Загрузка стилей и тем контрола
    * @param themeName имя темы (по-умолчанию тема приложения)
    * @param themes массив доп тем для скачивания
    * @param styles массив доп стилей для скачивания
    * @static
    * @method
    * @example
    * <pre>
    *     import('Controls/_popupTemplate/InfoBox')
    *         .then((InfoboxTemplate) => InfoboxTemplate.loadCSS('saby__dark'))
    * </pre>
    */
   static loadCSS(themeName?: string, themes: string[] = [], styles: string[] = []): Promise<void> {
      return Promise.all([
         this.loadStyles(styles),
         this.loadThemes(themeName, themes)
      ]).then(() => void 0);
   }
   /**
    * Загрузка тем контрола
    * @param instStyles опционально дополнительные темы экземпляра
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
      const themes = instThemes.concat(this._theme);
      if (themes.length === 0) {
         return Promise.resolve();
      }
      return Promise.all(themes.map((name) => themeController.get(name, themeName))).then(() => void 0);
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
      const styles = instStyles.concat(this._styles);
      if (styles.length === 0) {
         return Promise.resolve();
      }
      return Promise.all(styles.map((name) => themeController.get(name, EMPTY_THEME))).then(() => void 0);
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
      const styles = instStyles.concat(this._styles);
      const themes = instThemes.concat(this._theme);
      if (styles.length === 0 && themes.length === 0) {
         return Promise.resolve();
      }
      const removingStyles = Promise.all(styles.map((name) => themeController.remove(name, EMPTY_THEME)));
      const removingThemed = Promise.all(themes.map((name) => themeController.remove(name, themeName)));
      return Promise.all([removingStyles, removingThemed]).then(() => void 0);
   }
   static isCSSLoaded(themeName?: string, instThemes: string[] = [], instStyles: string[] = []): boolean {
      const themes = instThemes.concat(this._theme);
      const styles = instStyles.concat(this._styles);
      if (styles.length === 0 && themes.length === 0) {
         return true;
      }
      return themes.every((cssName) => themeController.isMounted(cssName, themeName)) &&
         styles.every((cssName) => themeController.isMounted(cssName, EMPTY_THEME));
   }
   //#endregion

   static extend(mixinsList: any, classExtender: any): Function {
      // @ts-ignore
      if (!require.defined('Core/core-extend')) {
         throw new ReferenceError(
            'You should require module "Core/core-extend" to use old "UI/_base/Control::extend()" method.'
         );
      }
      // @ts-ignore
      const coreExtend = require('Core/core-extend');
      return coreExtend(this, mixinsList, classExtender);
   }

   static _getInheritOptions(ctor: any): any {
      const inherit = (ctor.getInheritOptions && ctor.getInheritOptions()) || {};
      if (!inherit.hasOwnProperty('readOnly')) {
         inherit.readOnly = false;
      }
      if (!inherit.hasOwnProperty('theme')) {
         inherit.theme = 'default';
      }

      return inherit;
   }
   static createControl(ctor: any, cfg: any, domElement: HTMLElement): Control {
      if (domElement) {
         // если пришел jquery, вытащим оттуда элемент
         domElement = domElement[0] || domElement;
      }
      if (constants.compat) {
         cfg.iWantBeWS3 = true;
         cfg.element = domElement;
      }
      cfg._$createdFromCode = true;

      startApplication();
      // @ts-ignore
      if (!(domElement instanceof HTMLElement)) {
         const message = '[UI/_base/Control:createControl] domElement parameter is not an instance of HTMLElement. You should pass the correct dom element to control creation function.';
         Logger.error(message, ctor.prototype);
      }
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
      Focus.patchDom(domElement, cfg);
      ctr.saveFullContext(ContextResolver.wrapContext(ctr, { asd: 123 }));

      if (cfg.iWantBeWS3) {
         if (require.defined('Core/helpers/Hcontrol/makeInstanceCompatible')) {
            const makeInstanceCompatible = require('Core/helpers/Hcontrol/makeInstanceCompatible');
            makeInstanceCompatible(ctr, cfg);
         }
      }

      ctr.mountToDom(ctr._container, cfg, ctor);
      return ctr;
   }

   // </editor-fold>
}

// @ts-ignore
Control.prototype._template = template;

function logError(e: Error) {
   Logger.error(e.message);
}
/**
 * @name UI/_base/Control#readOnly
 * @cfg {Boolean} Определяет, может ли пользователь изменить значение контрола.
 * (или взаимодействовать с контролом, если его значение не редактируется).
 * @variant true Пользователь не может изменить значение контрола. (или взаимодействовать с контролом, если его значение не редактируется).
 * @variant false  Пользователь может изменить значение контрола. (или взаимодействовать с контролом, если его значение не редактируется).
 * @variant inherited Значение контрола унаследовано от родителя.
 * @default Inherited
 * @example
 * Рассмотрим на примере контролов List и Input. Текст будет отображаться со стилем "только для чтения", и пользователь не сможет его редактировать.
 * Однако, у кнопки есть опция readOnly, которая имеет значение false, поэтому кнопка не унаследует эту опцию из списка, и пользователь сможет кликнуть по ней.
 * <pre>
 *    <Controls.list:View readOnly="{{true}}">
 *       <ws:itemTemplate>
 *          <Controls.input:Text />
 *          <Controls.buttons:Path readOnly="{{false}}" />
 *       </ws:itemTemplate>
 *    </Controls.list:View>
 * </pre>
 * @remark Эта опция наследуется. Если параметр не задан явно, значение параметра наследуется от родительского контрола. По умолчанию все контролы активны.
 * @see Inherited options
 */

/*
 * @name UI/_base/Control#readOnly
 * @cfg {Boolean} Determines whether user can change control's value
 * (or interact with the control if its value is not editable).
 * @variant true User cannot change control's value (or interact with the control if its value is not editable).
 * @variant false User can change control's value (or interact with the control if its value is not editable).
 * @variant inherited Value inherited from the parent.
 * @default Inherited
 * @example
 * In this example, List and Input.Text will be rendered with read-only styles, and the user won't be
 * able to edit them. However, Button has readOnly option explicitly set to false,
 * thus it won't inherit this option from the List, and user will be able to click on it.
 * <pre>
 *    <Controls.list:View readOnly="{{true}}">
 *       <ws:itemTemplate>
 *          <Controls.input:Text />
 *          <Controls.buttons:Path readOnly="{{false}}" />
 *       </ws:itemTemplate>
 *    </Controls.list:View>
 * </pre>
 * @remark This option is inherited. If option is not set explicitly, option's value will be inherited
 * from the parent control. By default, all controls are active.
 * @see Inherited options
 */

/**
 * @name UI/_base/Control#theme
 * @cfg {String} Название темы оформления. В зависимости от темы загружаются различные таблицы стилей и применяются различные стили к контролу.
 * @default default
 * @example
 * В следующем примере {@link Controls/Application} и все его дочерние контролы будут иметь стиль темы оформления "carry". Однако контрол Carry.Head будет иметь тему "presto".
 * Если вы поместите контролы в Carry.Head и не укажите опцию theme, они унаследуют ее значение от родителей и тоже построятся в теме "presto".
 * <pre>
 *    <Controls.Application theme="carry">
 *       <Carry.Head theme="presto" />
 *       <Carry.Workspace>
 *          <Controls.Tree />
 *       </Carry.Workspace>
 *    </Controls.Application>
 * </pre>
 * @remark
 * default — это тема оформления "по умолчанию", которая распространяется вместе с исходным кодом контролов Wasaby и используется для их стилевого оформления.
 *
 * Когда значение опции не задано явно, оно будет взято от родительского контрола. Это продемонстрировано в примере.
 *
 * Подробнее о работе с темами оформления читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/themes/ здесь}.
 */

/*
 * @name UI/_base/Control#theme
 * @cfg {String} Theme name. Depending on the theme, different stylesheets are loaded and
 * different styles are applied to the control.
 * @variant any Any value that was passed to the control.
 * @variant inherited Value inherited from the parent.
 * @default ''(empty string)
 * @example
 * In this example, Controls.Application and all of its chil controls will have "carry" theme styles.
 * However, Carry.Head will "carry" theme styles. If you put controls inside Carry.Head and does not specify
 * the theme option, they will inherit "carry" theme.
 * <pre>
 *    <Controls.Application theme="carry">
 *       <Carry.Head theme="presto" />
 *       <Carry.Workspace>
 *          <Controls.Tree />
 *       </Carry.Workspace>
 *    </Controls.Application>
 * </pre>
 * @remark This option is inherited. If option is not set explicitly, option's value will be inherited
 * from the parent control. The path to CSS file with theme parameters determined automatically
 * based on the theme name. CSS files should be prepared in advance according to documentation.
 * @see Themes
 * @see Inherited options
 */
