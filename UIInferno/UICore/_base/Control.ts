/* tslint:disable */

// @ts-ignore
import template = require('wml!UICore/_base/Control');

// @ts-ignore FIXME: убрал зависимость от шаблонизатора - core перестал тянуться. Исследовать и исправить
import cExtend = require('Core/core-extend');

import { Synchronizer } from 'UICore/Vdom';
import { _IGeneratorType, OptionsResolver } from 'UICommon/Executor';
import { ContextResolver } from 'UICommon/Contexts';
import { _FocusAttrs, _IControl, activate, Events, focus } from 'UICore/Focus';
import { Logger, Purifier, needToBeCompatible } from 'UICommon/Utils';
import { goUpByControlTree } from 'UICore/NodeCollector';
import { constants } from 'Env/Env';
import { getGeneratorConfig } from './GeneratorConfig';

import { getThemeController, EMPTY_THEME } from 'UICommon/theme/controller';
import { ReactiveObserver } from 'UICore/Reactivity';

import startApplication from './startApplication';
import { getProxyChildren, IControlOptions, TemplateFunction } from 'UICommon/Base';

import { DisposeControl, IResourceDisposable } from 'Application/State';

import {
   TIState,
   TControlConfig,
   IControl
} from 'UICommon/interfaces';
import {
   ITemplateAttrs
} from 'UICore/interfaces';

interface IHasChildContext {
   _getChildContext?: Function;
}

export type IControlConstructor<TOptions extends IControlOptions = {}> = {
   new(cfg: TOptions): Control<TOptions> & IHasChildContext;
   prototype: Control<TOptions> & IHasChildContext;
};

export type IControlChildren = Record<string, Element | Control | Control<IControlOptions, {}>>;

/**
 * @event UICore/_base/Control#activated Происходит при активации контрола.
 * @param {Boolean} isTabPressed Указывает, был ли активирован контрол нажатием на клавишу Tab.
 * @param {Boolean} isShiftKey Указывает, был ли активирован контрол нажатием Tab+Shift.
 * @remark Контрол активируется, когда на один из его DOM-элементов переходит фокус.
 * Подробное описание и примеры использования события читайте
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/ здесь}.
 * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/
 * @see deactivated
 */

/*
 * @event UICore/_base/Control#activated Occurs when the component becomes active.
 * @param {Boolean} isTabPressed Indicates whether control was activated by Tab press.
 * @remark Control is activated when one of its DOM elements becomes focused. Detailed description and u
 * se cases of the event can be found
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/ here}.
 * @see Documentation: Activation system
 * @see deactivated
 */

/**
 * @event UICore/_base/Control#deactivated Происходит при деактивации контрола.
 * @param {Boolean} isTabPressed Указывает, был ли деактивирован контрол нажатием на клавишу Tab.
 * @remark Контрол перестает быть активным, когда все его дочерние контролы теряют фокус.
 * Подробное описание и примеры использования события читайте
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/ здесь}.
 * @see activated
 */

/*
 * @event UICore/_base/Control#deactivated Occurs when control becomes inactive.
 * @param {Boolean} isTabPressed Indicates whether control was deactivated by Tab press.
 * @remark Control is deactivated when all of its child component lose focus.
 * Detailed description and use cases of the event can be found
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/ here}.
 * @see Documentation: Activation system
 * @see activated
 */

let countInst = 1;

// tslint:disable-next-line
const EMPTY_FUNC = function () { };

const BL_MAX_EXECUTE_TIME = 5000;
const CONTROL_WAIT_TIMEOUT = 20000;

interface IContext {
   scope: unknown;
   get(field: string): Record<string, unknown>;
   set(): void;
   has(): boolean;
}

function createContext(): IContext {
   let _scope: unknown = null;
   return {
      set scope(value: unknown) {
         _scope = value;
      },
      get(field: string): Record<string, unknown> {
         if (_scope && _scope.hasOwnProperty(field)) {
            return _scope[field];
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
}

export const _private = {
   _checkAsyncExecuteTime: function<TState, TOptions extends IControlOptions>(startTime: number, customBLExecuteTime: number, moduleName: string, instance: Control<TOptions, TState>): void {
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
         Logger.warn(message, instance);
      }
   },

   _asyncClientBeforeMount: function <TState, TOptions extends IControlOptions>(resultBeforeMount: Promise<void | TState>, time: number, customBLExecuteTime: number, moduleName: string, instance: Control<TOptions, TState>): Promise<void | TState> | boolean {
      let startTime = Date.now();

      let asyncTimer = setTimeout(() => {
         const message = `Ошибка построения на клиенте!
            Promise, который вернули из метода _beforeMount контрола ${moduleName} ` +
             `не завершился за ${time} миллисекунд.
            Необходимо проверить правильность написания асинхронных вызовов в _beforeMount контрола ${moduleName}.
            Возможные причины:
            - Promise не вернул результат/причину отказа
            - Метод БЛ выполняется более 20 секунд`;
         Logger.error(message, instance);
      }, time);

      return resultBeforeMount.finally(() => {
             clearTimeout(asyncTimer);
             _private._checkAsyncExecuteTime(startTime, customBLExecuteTime, moduleName, instance);
          }
      );
   },
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
 * Базовый контрол, от которого наследуются все интерфейсные контролы фреймворка Wasaby.
 * Подробнее о работе с классом читайте <a href="/doc/platform/developmentapl/interface-development/ui-library/control/">здесь</a>.
 * @class UICore/_base/Control
 * @author Шипин А.А.
 * @remark <a href="/doc/platform/developmentapl/interface-development/ui-library/asynchronous-control-building/">Asynchronous creation of UI/Base:AsyncCreator component</a>
 * @ignoreMethods isBuildVDom isEnabled isVisible _getMarkup
 * @public
 */
class Control<TOptions extends IControlOptions = {}, TState extends TIState = void> implements IControl {
   protected _moduleName: string;

   private _mounted: boolean = false;
   private _unmounted: boolean = false;
   private _destroyed: boolean = false;
   private _$active: boolean = false;
   private _reactiveStart: boolean = false;
   private _$needForceUpdate: boolean;
   private _isPendingBeforeMount: boolean = false;

   private readonly _instId: string = 'inst_' + countInst++;
   protected _options: TOptions = {} as TOptions;
   private _internalOptions: Record<string, unknown>;
   private _resources = new DisposeControl(this);
   /**
    * TODO: delete it
    */
       // @ts-ignore
   private _fullContext: Record<string, any>;

   private _evaluatedContext: IContext;

   private get context(): IContext {
      if (!this._evaluatedContext) {
         this._evaluatedContext = createContext();
      }
      return this._evaluatedContext;
   }

   private set context(value: IContext) {
      this._evaluatedContext = value;
   }

   /**
    * end todo
    */

   private _context: any;
   private _$resultBeforeMount: any;

   protected _template: TemplateFunction;
   protected _clientTimeout: number;
   protected _allowNativeEvent: boolean = false;

   // protected for compatibility, should be private
   protected _container: HTMLElement = null;

   // TODO: Временное решение. Удалить после выполнения удаления всех использований.
   // Ссылка: https://online.sbis.ru/opendoc.html?guid=5f576e21-6606-4a55-94fd-6979c6bfcb53.
   private _logicParent: Control<IControlOptions, void>;

   protected _children: IControlChildren;

   private _savedInheritOptions: unknown;

   private _controlNode: any;

   private _environment: any;

   private _isRendered: boolean;

   constructor(cfg: TControlConfig, context?: any) {
      if (!cfg) {
         cfg = {};
      }

      if (cfg._logicParent && !(cfg._logicParent instanceof Control)) {
         Logger.error('Option "_logicParent" is not instance of "Control"', this);
      }

      this._children = getProxyChildren.apply(this);

      //@ts-ignore
      this._logicParent = cfg._logicParent;

      /*dont use this*/
      if (this._afterCreate) {
         this._afterCreate(cfg);
      }
   }

   /**
    * TODO: delete it
    */

   private saveFullContext(ctx: unknown): void {
      this._fullContext = ctx;
   }

   private _saveContextObject(ctx: unknown):void {
      this.context.scope = ctx;
      this._context = ctx;
   }

   /**
    * end todo
    */

   private saveInheritOptions(opts: any): void {
      this._savedInheritOptions = opts;
   }

   private _saveEnvironment(env: unknown, cntNode: unknown): void {
      this._controlNode = cntNode;
      this._environment = env;
   }

   private _getEnvironment(): any {
      return this._environment;
   }
   /** добавить ресурс, за которым будет происходить слежка */
   protected attach(resource: IResourceDisposable): void {
      this._resources.track(resource);
   }
   protected _beforeUnmountLimited(): void {
      this._resources.dispose();
   }

   protected _notify(eventName: string, args?: unknown[], options?: {bubbling?: boolean}): unknown {
      if (args && !(args instanceof Array)) {
         var error = `Ошибка использования API событий. В метод _notify() в качестве второго аргументов необходимо передавать массив (была передан объект типа ${typeof args})
                     Контрол: ${this._moduleName}
                     Событие: ${eventName}
                     Аргументы: ${args}
                     Подробнее о событиях: https://wasaby.dev/doc/platform/ui-library/events/#params-from-notify`;
         Logger.error(error, this);
         throw new Error(error);
      }
      return this._environment && this._environment.eventSystem.startEvent(this._controlNode, arguments);
   }

   /**
    * Метод, который возвращает разметку для компонента
    * @param rootKey
    * @param attributes
    * @param isVdom
    */
   _getMarkup(
       rootKey?: string,
       attributes?: ITemplateAttrs,
       isVdom: boolean = true
   ): any {
      if (!this._template.stable) {
         Logger.error(`[UICore/_base/Control:_getMarkup] Check what you put in _template "${this._moduleName}"`, this);
         return '';
      }
      let res;

      if (!attributes) {
         attributes = {};
      }
      attributes.context = this._fullContext;
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
      // временное решение до тех пор пока опция темы не перестанет быть наследуемой
      // добавлено тут https://online.sbis.ru/opendoc.html?guid=5a70cc3b-0d05-4071-8ba3-3dd6cd1ba0bd
      if (this._options._$createdFromCode) {
         if (generatorConfig?.prepareAttrsForRoot) {
            generatorConfig.prepareAttrsForRoot(attributes, this._options);
         }
      }
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

   render(empty?: any, attributes?: any): any {
      let markup;
      ReactiveObserver.forbidReactive(this, () => {
         markup = this._getMarkup(null, attributes, false);
      });
      this._isRendered = true;
      return markup;
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
      if (!this._mounted) {
         // _forceUpdate was called asynchronous from _beforeMount before control was mounted to DOM
         // So we need to delay _forceUpdate till the moment component will be mounted to DOM
         this._$needForceUpdate = true;
      } else {
         if (this._environment) {
            // This is fix for specific case. When environment has _haveRebuildRequest and after that
            // we creating another one. We don't have to do that, it's better to delay rebuild, after current
            // sync cycle.
            // after 410 condition "this._moduleName === 'FED2/UI/DocumentCompatible'" will be deleted.
            if (this._environment._haveRebuildRequest && this._moduleName === 'FED2/UI/DocumentCompatible') {
               this._$needForceUpdate = true;
            } else {
               this._environment.forceRebuild(this._controlNode.id);
            }

         }
      }
   }

   getInstanceId(): string {
      return this._instId;
   }

   mountToDom(element: HTMLElement, cfg: TOptions): void {
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
      this._options = options as TOptions;
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
         // @ts-ignore
         const contextTypes = this.constructor.contextTypes ? this.constructor.contextTypes() : {};
         for (const i in contextTypes) {
            // Need to check if context field actually exists.
            // Because context field can be described in contextTypes but not provided by parent of the control.
            if (contextTypes.hasOwnProperty(i) && this.context.get(i) instanceof contextTypes[i]) {
               // @ts-ignore
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
         this._evaluatedContext = null;
      } catch (error) {
         Logger.lifeError('_beforeUnmount', this, error);
      }

      // У чистого Wasaby контрола нет метода getParent, у совместимого - есть;
      // @ts-ignore
      const isPureWasaby: boolean = !this.getParent;
      if (isPureWasaby) {
         const async: boolean = !Purifier.canPurifyInstanceSync(this._moduleName);
         Purifier.purifyInstance(this, this._moduleName, async);
      }
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
    * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/focus/ here}.
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

    deactivate(): void {
        const container = this._container;
        const activeElement = document.activeElement;
        if (!container.contains(activeElement)) {
            return;
        }

        if (!focus(container)) {
            return;
        }

        Events.notifyActivationEvents(container, activeElement);
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
   protected _beforeMount(options?: TOptions, contexts?: object, receivedState?: TState): Promise<TState | void> | void {
      return undefined;
   }

   __beforeMount(options?: TOptions,
                 contexts?: object,
                 receivedState?: TState): Promise<TState | void> | void {
      if (this._$resultBeforeMount) {
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

      let resultBeforeMount = this._beforeMount.apply(this, arguments);

      if (hasCompatible) {
         this._options = savedOptions;
      }

      // prevent start reactive properties if beforeMount return Promise.
      // Reactive properties will be started in Synchronizer
      if (resultBeforeMount && resultBeforeMount.callback) {
         this._isPendingBeforeMount = true;
         resultBeforeMount.then(() => {
            this._reactiveStart = true;
            this._isPendingBeforeMount = false;
         }).catch (() => {});

         //start client render
         if (typeof window !== 'undefined') {
            let clientTimeout = this._clientTimeout ? (this._clientTimeout > CONTROL_WAIT_TIMEOUT ? this._clientTimeout : CONTROL_WAIT_TIMEOUT) : CONTROL_WAIT_TIMEOUT;
            _private._asyncClientBeforeMount(resultBeforeMount, clientTimeout, this._clientTimeout, this._moduleName, this);
         }
      } else {
         // _reactiveStart means starting of monitor change in properties
         this._reactiveStart = true;
      }
      const cssLoading = Promise.all([
         this.loadThemes(options.theme),
         this.loadStyles()
      ]);
      if (!options.notLoadThemes) {
         //Если ждать загрузки стилей новой темизации. то му получаем просадку производительности
         //https://online.sbis.ru/doc/059aaa9a-e123-49ce-b3c3-e828fdd15e56
         this.loadThemeVariables(options.theme)
      }
      if (constants.isServerSide || this.isDeprecatedCSS() || this.isCSSLoaded(options.theme)) {
         return this._$resultBeforeMount = resultBeforeMount;
      }
      return this._$resultBeforeMount = cssLoading.then(() => resultBeforeMount);
   }

   //#region CSS private
   private isDeprecatedCSS(): boolean {
      // @ts-ignore
      const isDeprecatedCSS = this._theme instanceof Array || this._styles instanceof Array;
      if (isDeprecatedCSS) {
         Logger.warn("Стили и темы должны перечисляться в статическом свойстве класса " + this._moduleName);
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
   private loadThemeVariables(themeName?: string): Promise<void> {
      return this.constructor['loadThemeVariables'](themeName).catch(logError);
   }
   //#endregion

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
   /*
    * Control’s sync lifecycle hook. Called right after component was mounted to DOM.
    * @param {Object} options Control's options.
    * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls."
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
    * @remark This is the first lifecycle hook called after control was mounted to DOM.
    * At this stage, you can access options and context at this._options and this._context.
    * This hook is frequently used to access DOM elements and to subscribe to server events.
    * Detailed description of lifecycle hooks can be found here.
   * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases

    */
   protected _componentDidMount(options?: TOptions, contexts?: any): void {
      // Do
   }

   /**
    * Асинхронный хук жизненного цикла контрола. Вызывается сразу после установки контрола в DOM-окружение.
    * @param {Object} options Опции контрола.
    * @param {Object} context Поле контекста, запрошенное контролом.
    * @example
    * <pre class="brush: js">
    *    Control.extend({
    *       ...
    *       _afterMount(options, context) {
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
    * Control’s async lifecycle hook. Called right after component was mounted to DOM.
    * @param {Object} options Control's options.
    * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls."
    * @example
    * <pre>
    *    Control.extend({
    *       ...
    *        _afterMount(options, context) {
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
   * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */
   protected _afterMount(options?: TOptions, contexts?: any): void {
      // Do
   }

   /*
    * @param {TOptions} newOptions
    * @deprecated @param {Object} context устаревшая опция с контекстом
    */
   __beforeUpdate(newOptions: TOptions, context?: Record<string, any>): void {
      if (newOptions.theme !== this._options.theme) {
         this.loadThemes(newOptions.theme);
         this.loadThemeVariables(newOptions.theme);
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
    * @param {Object} [context] Поле контекста, запрошенное контролом. Параметр считается deprecated, поэтому откажитесь от его использования.
    * @returns {Boolean}
    * * true (значание по умолчанию): контрол будет обновлен.
    * * false: контрол не будет обновлен. Хук {@link UICore/Base:Control#_afterUpdate _afterUpdate} не будет вызван.
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
   protected _shouldUpdate(options: TOptions, context?: Record<string, any>): boolean {
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
    *       _componentDidUpdate() {
    *
    *          // Accessing DOM elements to some fix after render.
    *          this._container.scrollTop = this._savedScrollTop;
    *       }
    *       ...
    *    });
    * </pre>
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */
   protected _componentDidUpdate(oldOptions?: TOptions, oldContext?: any): void {
      // Do
   }

   protected _afterRender(oldOptions?: TOptions, oldContext?: any): void {
      // Do
   }

   private __afterRender(oldOptions?: TOptions, oldContext?: any): void {
      // TODO: включить после согласования имени нового хука и автозамены
      // Logger.warn(`Хук "_afterRender" более не поддерживает.
      //    Следует переименовать хук в "_componentDidUpdate"
      //    Контрол: ${ this._moduleName }`, this);
      this._afterRender.apply(this, arguments);
   }

   /**
    * Асинхронный хук жизненного цикла контрола. Вызывается после обновления контрола.
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
    * Control’s lifecycle async hook. Called after control was updated.
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
    * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
    */
   protected _afterUpdate(oldOptions?: TOptions, oldContext?: any): void {
      // Do
   }

   __beforeUnmount(): void {
      this._beforeUnmount.apply(this, arguments);
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

   public getPendingBeforeMountState(): boolean {
      return this._isPendingBeforeMount;
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
      const themeController = getThemeController();
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
      const themeController = getThemeController();
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
      const themeController = getThemeController();
      const styles = instStyles.concat(this._styles);
      const themes = instThemes.concat(this._theme);
      if (styles.length === 0 && themes.length === 0) {
         return Promise.resolve();
      }
      const removingStyles = Promise.all(styles.map((name) => themeController.remove(name, EMPTY_THEME)));
      const removingThemed = Promise.all(themes.map((name) => themeController.remove(name, themeName)));
      return Promise.all([removingStyles, removingThemed]).then(() => void 0);
   }
   /**
    * Проверка загрузки стилей и тем контрола
    * @param {String} themeName имя темы (по-умолчанию тема приложения)
    * @param {Array<String>} themes массив доп тем для скачивания
    * @param {Array<String>} styles массив доп стилей для скачивания
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
   //#endregion

   static extend(mixinsList: any, classExtender?: any): Function {
      // // @ts-ignore
      // if (!require.defined('Core/core-extend')) {
      //    throw new ReferenceError(
      //       'You should require module "Core/core-extend" to use old "UICore/_base/Control::extend()" method.'
      //    );
      // }
      // // @ts-ignore
      // const coreExtend = require('Core/core-extend');
      return cExtend(this, mixinsList, classExtender);
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

   static createControl(ctor: IControlConstructor, cfg: TControlConfig, domElement: HTMLElement): Control {
      if (domElement) {
         // если пришел jquery, вытащим оттуда элемент
         domElement = domElement[0] || domElement;
      }
      if (!(ctor && ctor.prototype)) {
         const message = '[UICore/_base/Control:createControl] Аргумент ctor должен являться классом контрола!';
         Logger.error(message, ctor.prototype);
      }
      if (!(domElement instanceof HTMLElement)) {
         const message = '[UICore/_base/Control:createControl] domElement parameter is not an instance of HTMLElement. You should pass the correct dom element to control creation function.';
         Logger.error(message, ctor.prototype);
      }
      if (!document.documentElement.contains(domElement)) {
         const message = '[UICore/_base/Control:createControl] domElement parameter is not contained in document. You should pass the correct dom element to control creation function.';
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

      ctr.mountToDom(ctr._container, cfg);
      return ctr;
   }

   // </editor-fold>
}

Object.assign(Control.prototype, {
   _template: template
});
((Control.prototype as any)._notify as any)._isVdomNotify = true;

function logError(e: Error) {
   Logger.error(e.message);
}

export default Control;

/**
 * @name UICore/_base/Control#readOnly
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
 * @name UICore/_base/Control#readOnly
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
 * @name UICore/_base/Control#theme
 * @cfg {String} Название {@link /doc/platform/developmentapl/interface-development/themes/ темы оформления}. В зависимости от темы загружаются различные таблицы стилей и применяются различные стили к контролу.
 * @default default
 * @example
 * В следующем примере {@link Controls/Application} и все его дочерние контролы будут иметь стиль темы оформления "carry". Однако контрол Carry.Head будет иметь тему "presto".
 * Если вы поместите контролы в Carry.Head и не укажите опцию theme, они унаследуют ее значение от родителей и тоже построятся в теме "presto".
 * <pre>
 *    <SbisEnvUI.Bootstrap theme="carry">
 *       <Carry.Head theme="presto" />
 *       <Carry.Workspace>
 *          <Controls.Tree />
 *       </Carry.Workspace>
 *    </SbisEnvUI.Bootstrap>
 * </pre>
 * @remark
 * default — это тема оформления "по умолчанию", которая распространяется вместе с исходным кодом контролов Wasaby и используется для их стилевого оформления.
 *
 * Когда значение опции не задано явно, оно будет взято от родительского контрола. Это продемонстрировано в примере.
 *
 * Подробнее о работе с темами оформления читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/themes/ здесь}.
 */

/**
 * @name UICore/_base/Control#notLoadThemes
 * @cfg {Boolean} Флаг, который отключает загрузку переменных тем оформления для контролов.
 * @default undefined
 */

/*
 * @name UICore/_base/Control#theme
 * @cfg {String} Theme name. Depending on the theme, different stylesheets are loaded and
 * different styles are applied to the control.
 * @variant any Any value that was passed to the control.
 * @variant inherited Value inherited from the parent.
 * @default ''(empty string)
 * @example
 * In this example, SbisEnvUI.Bootstrap and all of its chil controls will have "carry" theme styles.
 * However, Carry.Head will "carry" theme styles. If you put controls inside Carry.Head and does not specify
 * the theme option, they will inherit "carry" theme.
 * <pre>
 *    <SbisEnvUI.Bootstrap theme="carry">
 *       <Carry.Head theme="presto" />
 *       <Carry.Workspace>
 *          <Controls.Tree />
 *       </Carry.Workspace>
 *    </SbisEnvUI.Bootstrap>
 * </pre>
 * @remark This option is inherited. If option is not set explicitly, option's value will be inherited
 * from the parent control. The path to CSS file with theme parameters determined automatically
 * based on the theme name. CSS files should be prepared in advance according to documentation.
 * @see Themes
 * @see Inherited options
 */
