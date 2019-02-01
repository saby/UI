// @ts-ignore
import template = require('wml!UI/_base/Control');



// @ts-ignore
import IoC = require('Core/IoC');
// @ts-ignore
import doAutofocus = require('Core/helpers/Hcontrol/doAutofocus');

import { Synchronizer, TabIndex } from 'Vdom/Vdom';
import { OptionsResolver } from 'View/Executor/Utils';
import { Focus, ContextResolver } from 'View/Executor/Expressions';

import ThemesController = require('Core/Themes/ThemesControllerNew');
import PromiseLib = require('Core/PromiseLib/PromiseLib');
import Logger from 'View/Logger';

/**
 * @event Core/Control#activated Occurs when the component becomes active.
 * @param {Boolean} isTabPressed Indicates whether control was activated by Tab press.
 * @remark Control is activated when one of its DOM elements becomes focused. Detailed description and u
 * se cases of the event can be found
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
 * @see Documentation: Activation system
 * @see deactivated
 */

/**
 * @event Core/Control#deactivated Occurs when control becomes inactive.
 * @param {Boolean} isTabPressed Indicates whether control was deactivated by Tab press.
 * @remark Control is deactivated when all of its child component lose focus.
 * Detailed description and use cases of the event can be found
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
 * @see Documentation: Activation system
 * @see activated
 */

let countInst = 1;

class Control {
   static isWasaby: Boolean = true;

   private _mounted: Boolean = false;
   private _unmounted: Boolean = false;
   private _destroyed: Boolean = false;
   private _active: Boolean = false;

   private _instId: string;
   private _options: any = null;
   private _internalOptions: HashMap<string, any> = null;

   public getInstanceId(): string {
      return this._instId;
   }

   private _container: HTMLElement = null;

   public mountToDom(element: HTMLElement, cfg: any, controlClass: any) {
      if (!this._mounted) {
         this._mounted = true;
         this._container = element;
         Synchronizer.mountControlToDOM(this, controlClass, cfg, this._container);
      }
      if (cfg) {
         this.saveOptions(cfg);
      }
   }

   // Just save link to new options
   public saveOptions(options: any, controlNode:any = null): Boolean {
      this._options = options;
      if (controlNode) {
         this._container = controlNode.element;
      }
      return true;
   }

   static _getInheritOptions(ctor: any): any {
      var inherit = ctor.getInheritOptions && ctor.getInheritOptions() || {};
      if (!inherit.hasOwnProperty('readOnly')) {
         inherit.readOnly = false;
      }
      if (!inherit.hasOwnProperty('theme')) {
         inherit.theme = '';
      }

      return inherit;
   }

   static createControl(ctor: any, cfg: any, domElement: HTMLElement):Control {
      var defaultOpts = OptionsResolver.getDefaultOptions(ctor);
      OptionsResolver.resolveOptions(ctor, defaultOpts, cfg);
      var attrs = { inheritOptions: {} }, ctr;
      OptionsResolver.resolveInheritOptions(ctor, attrs, cfg, true);
      try {
         ctr = new ctor(cfg);
      } catch (error) {
         ctr = new Control({});
         Logger.catchLifeCircleErrors('constructor', error);
      }
      ctr.saveInheritOptions(attrs.inheritOptions);
      ctr._container = domElement;
      Focus.patchDom(domElement, cfg);
      ctr.saveFullContext(ContextResolver.wrapContext(ctr, { asd: 123 }));
      ctr.mountToDom(ctr._container, cfg, ctor);
      return ctr;

   };

   /**
    * TODO: delete it
    */
   private _context: any = null;
   private context: any = null;
   private saveFullContext:any = null;
   private _saveContextObject:any = null;


   private _saveEnvironment:Function = null;
   private saveInheritOptions:Function = null;
   private _getEnvironment:Function = null;
   private _notify:Function = null;

   /**
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
   public _forceUpdate:Function = null;

   //Render function for virtual dom
   public _getMarkup: Function = null;
   //Render function for text generator
   public render: Function = null;

   public _children:HasMap<string, Control>  = null;

   constructor(cfg: any) {
      if (!cfg) {
         cfg = {};
      }

      /**
       * TODO: delete it
       */
      let fullContext = null,
         _contextObj = null;

      this.saveFullContext = (ctx) => {
         fullContext = ctx;
      };

      this._saveContextObject = (ctx) => {
         _contextObj = ctx;
         this._context = ctx;
      };

      this.context = {
         get: function(field) {
            if (_contextObj && _contextObj.hasOwnProperty(field)) {
               return _contextObj[field];
            }
            return null;
         },
         set: function() {
            throw new Error("Can't set data to context. Context is readonly!");
         },
         has: function() {
            return true;
         }
      };

      /**
       * end todo
       */


      let controlNode = null,
         savedInheritOptions = null,
         environment = null;

      this.saveInheritOptions = (opts: any) => {
         savedInheritOptions = opts;
      };

      this._saveEnvironment = (env, cntNode) => {
         controlNode = cntNode;
         environment = env;
      };

      this._getEnvironment = () => {
         return environment;
      };

      this._notify = function() {
         return environment && environment.startEvent(controlNode, arguments);
      };

      this._forceUpdate = () => {
         let control = this || (controlNode && controlNode.control);
         if (control && !control._mounted) {
            // _forceUpdate was called asynchronous from _beforeMount before control was mounted to DOM
            // So we need to delay _forceUpdate till the moment component will be mounted to DOM
            control._$needForceUpdate = true;
         } else {
            environment && environment.forceRebuild(controlNode.id);
         }
      };

      /**
       * Метод, который возвращает разметку для компонента
       * @param rootKey
       * @returns {*}
       */
      this._getMarkup = function _getMarkup(rootKey, isRoot, attributes, isVdom) {
         if (!this._template.stable) {
            IoC.resolve('ILogger').error(this._moduleName, 'Check what you put in _template');
            return '';
         }
         let res;

         if (isVdom === undefined) {
            isVdom = true;
         }
         if (!attributes) {
            attributes = {};
         }
         attributes.context = fullContext;
         attributes.inheritOptions = savedInheritOptions;
         for (var i in attributes.events) {
            if (attributes.events.hasOwnProperty(i)) {
               for (var handl = 0; handl < attributes.events[i].length; handl++) {
                  if (attributes.events[i][handl].fn.isControlEvent &&
                      !attributes.events[i][handl].fn.controlDestination) {
                     attributes.events[i][handl].fn.controlDestination = this;
                  }
               }
            }
         }
         res = this._template(this, attributes, rootKey, isVdom);
         if (res) {
            if (isVdom) {
               for (var k = 0; k < res.length; k++) {
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


      this.render = function(empty, attributes) {
         var markup = this._getMarkup(null, true, attributes, false);
         this._isRendered = true;
         return markup;
      };

      this._options = {};
      this._internalOptions = {};
      this._children = {};
      this._instId = 'inst_' + countInst++;

      /*dont use this*/
      this._afterCreate && this._afterCreate(cfg);
   }

   /**
    * Метод задания значения служебной опции
    * @param {string} name Имя служебной опции
    * @param {*} value Значение опции
    */
   private _setInternalOption(name:string, value:any): void {
      if (!this._internalOptions) {
         this._internalOptions = {};
         IoC.resolve('ILogger').error('Component with ' + (this._options ? ('name ' + this._options.name + ' config ' + this._options.__$config) : ('maybe id ' + this._$id)), 'Control.constructor wasn\'t called');
      }
      this._internalOptions[name] = value;
   }

   /**
    * Метод задания служебных опций
    * @param {Object} internal Объект, содержащий ключи и значения устанавливаемых служебных опций
    */
   public _setInternalOptions(internal: HashMap<string, any>): void {
      for (let name in internal) {
         if (internal.hasOwnProperty(name)) {
            this._setInternalOption(name, internal[name]);
         }
      }
   }

   public _manageStyles(theme, oldTheme) {
      if(!this._checkNewStyles()) {
         return true;
      }
      var themesController = ThemesController.getInstance();
      var styles = this._styles || [];
      var themedStyles = this._theme || [];
      if(oldTheme) {
         this._removeOldStyles(themesController, oldTheme, themedStyles, []);
      }
      return this._loadNewStyles(themesController, theme, themedStyles, styles);
   }

   public _checkNewStyles(): Boolean {
      if((this._theme && !this._theme.forEach) || (this._style && !this._style.forEach)) {
         return false;
      }
      return true;
   }

   public _loadNewStyles(themesController, theme, themedStyles, styles): any {
      let self = this;
      let promiseArray = [];
      if (typeof window === 'undefined') {
         styles.forEach(function(name) {
            themesController.pushCss(name);
         });
         themedStyles.forEach(function(name) {
            themesController.pushThemedCss(name, theme);
         });
      } else {
         styles.forEach(function(name) {
            if (themesController.isCssLoaded(name)) {
               themesController.pushCssLoaded(name);
            } else {
               let loadPromise = PromiseLib.reflect(PromiseLib.wrapTimeout(themesController.pushCssAsync(name), 2000));
               loadPromise.then(function(res) {
                  if(res.status === 'rejected') {
                     IoC.resolve('ILogger').error('Styles loading error', 'Could not load style '
                         + name + ' for control ' + self._moduleName);
                  }
               });
               promiseArray.push(loadPromise);
            }
         });
         themedStyles.forEach(function(name) {
            if (themesController.isThemedCssLoaded(name, theme)) {
               themesController.pushCssThemedLoaded(name, theme);
            } else {
               let loadPromise = PromiseLib.reflect(PromiseLib.wrapTimeout(themesController.pushCssThemedAsync(name, theme), 2000));
               loadPromise.then(function(res) {
                  if(res.status === 'rejected') {
                     IoC.resolve('ILogger').error('Styles loading error', 'Could not load style '
                         + name + ' for control ' + self._moduleName +
                         ' with theme ' + theme);
                  }
               });
               promiseArray.push(loadPromise);
            }
         });
         if (promiseArray.length) {
            return Promise.all(promiseArray);
         }
      }
      return true;
   }

   public _removeOldStyles(themesController, theme, themedStyles, styles) {
      styles.forEach(function(name) {
         themesController.removeCss(name);
      });
      themedStyles.forEach(function(name) {
         themesController.removeCssThemed(name, theme);
      });
   }

   public _removeStyles(theme) {
      if(!this._checkNewStyles()) {
         return true;
      }
      var themesController = ThemesController.getInstance();
      var styles = this._styles || [];
      var themedStyles = this._theme || [];
      this._removeOldStyles(themesController, theme, themedStyles, styles);
   }

   public destroy(): void {
      this._destroyed = true;
      try {
         let contextTypes = this.constructor.contextTypes ? this.constructor.contextTypes() : {};
         for (var i in contextTypes) {
            if (contextTypes.hasOwnProperty(i)) {
               this.context.get(i).unregisterConsumer(this);
            }
         }
         if (this._mounted) {
            this.__beforeUnmount();
            Synchronizer.cleanControlDomLink(this._container);
         }
      } catch (error) {
         Logger.catchLifeCircleErrors('_beforeUnmount', error);
      }
   }

   // <editor-fold desc="API">

   public _blur(): void {
      let container = this._container[0] ? this._container[0] : this._container,
          activeElement = document.activeElement,
          tmpTabindex;

      if (!Focus.closest(document.activeElement, container)) {
         return;
      }

      // задача - убрать фокус с текущего элемента. куда? ну, например на body
      // чтобы можно было перевести фокус на body, сначала выставим табиндекс, а потом уберем
      if (document.body.tabIndex === -1) {
         tmpTabindex = document.body.tabIndex;
         document.body.tabIndex = 1;
      }
      document.body.focus();
      if (this._active) {
         var env = container.controlNodes[0].environment;

         // если DOMEnvironment не перехватил переход фокуса, вызовем обработчик ухода фокуса вручную
         env._handleFocusEvent({ target: document.body, relatedTarget: activeElement });
      }

      if (tmpTabindex !== undefined) {
         document.body.tabIndex = tmpTabindex;
      }
   }

   /**
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
    * @remark Method finds DOM element inside the control (and its child controls) that can be focused and
    * sets focus on it. Returns true if focus was set successfully and false if nothing was focused.
    * When control becomes active, all of its child controls become active too. When control activates,
    * it fires activated event. Detailed description of the activation algorithm can be found
    * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
    * @see Documentation: Activation system
    * @see activated
    * @see deactivated
    */
   public activate(): Boolean {
      function doFocus(container):Boolean {
         var res = false,
            activeElement = document.activeElement;
         if (container.wsControl && container.wsControl.setActive) {
            // если нашли контейнер старого контрола, активируем его старым способом (для совместимости)
            if (container.wsControl.canAcceptFocus()) {
               container.wsControl.setActive(true);
               res = container.wsControl.isActive();
            } else {
               // todo попробовать поискать следующий элемент?
               res = false;
            }
         } else {
            if (TabIndex.getElementProps(container).tabStop) {
               TabIndex.focus(container);
            }
            res = container === document.activeElement;

            container = this._container[0] ? this._container[0] : this._container;

            // может случиться так, что на focus() сработает обработчик в DOMEnvironment, и тогда тут ничего не надо делать
            // todo делать проверку не на _active а на то, что реально состояние изменилось. например переходим от
            // компонента к его предку, у предка состояние не изменилось. но с которого уходили у него изменилось
            if (res && !this._active) {
               var env = container.controlNodes[0].environment;
               env._handleFocusEvent({ target: container, relatedTarget: activeElement });
            }
         }
         return res;
      }

      let res = false,
         container = this._container[0] ? this._container[0] : this._container;

      // сначала попробуем поискать по ws-autofocus, если найдем - позовем focus рекурсивно для найденного компонента
      var autofocusElems = doAutofocus.findAutofocusForVDOM(container),
         autofocusElem,
         found;

      for (var i = 0; i < autofocusElems.length; i++) {
         autofocusElem = autofocusElems[i];

         // если что-то зафокусировали, перестаем поиск
         if (!found) {
            // фокусируем только найденный компонент, ws-autofocus можно повесить только на контейнер компонента
            if (autofocusElem && autofocusElem.controlNodes && autofocusElem.controlNodes.length) {
               res = autofocusElem.controlNodes[0].control.activate();
               found = res;
            }
         }
      }

      // если не получилось найти по автофокусу, поищем первый элемент по табиндексам и сфокусируем его.
      // причем если это будет конейнер старого компонента, активируем его по старому тоже
      if (!found) {
         // так ищем DOMEnvironment для текущего компонента. В нем сосредоточен код по работе с фокусами.
         let getElementProps = TabIndex.getElementProps;
         let next = TabIndex.findFirstInContext(container, false, getElementProps);
         if (next) {
            // при поиске первого элемента игнорируем vdom-focus-in и vdom-focus-out
            let startElem = 'vdom-focus-in';
            let finishElem = 'vdom-focus-out';
            if (next.classList.contains(startElem)) {
               next = TabIndex.findWithContexts(container, next, false, getElementProps);
            }
            if (next.classList.contains(finishElem)) {
               next = null;
            }
         }
         if (next) {
            res = doFocus.call(this, next);
         } else {
            res = doFocus.call(this, container);
         }
      }

      return res;
   }

   public _afterCreate(cfg: any): void {

   }
   /**
    * Control’s lifecycle hook. Called right before the mounting of the component to DOM.
    *
    * @param {Object} options Control's options.
    * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls".
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
    * @private
    */
   public _beforeMount(): Promise<any> {
      return Promise.resolve();
   }

   private _styles: Array<string> = [];
   private _theme: Array<string> = [];

   public _beforeMountLimited(opts:any) {
      var resultBeforeMount = this._beforeMount.apply(this, arguments);

      if (typeof window === 'undefined') {
         if (resultBeforeMount && resultBeforeMount.callback) {
            resultBeforeMount = new Promise((resolve, reject) => {
               var timeout = 0;
               resultBeforeMount.then((result) => {
                  if (!timeout) {
                     timeout = 1;
                     resolve(result);
                  }
                  return result;
               }, (error) => {
                  if (!timeout) {
                     timeout = 1;
                     reject(error);
                  }
                  return error;
               });
               setTimeout(() => {
                  if (!timeout) {
                     /* Change _template and _afterMount
                         *  if execution was longer than 2 sec
                         * */
                     IoC.resolve('ILogger').error('_beforeMount', 'Wait 20000 ms ' + this._moduleName);
                     timeout = 1;
                     require(['View/Runner/tclosure'], function(thelpers) {
                        this._originTemplate = this._template;
                        this._template = function(data, attr, context, isVdom, sets) {
                           try {
                              return this._originTemplate.apply(self, arguments);
                           } catch (e) {
                              return thelpers.getMarkupGenerator(isVdom).createText('');
                           }
                        };
                        this._template.stable = true;
                        this._afterMount = function() {};
                        resolve(false);
                     });
                  }
               }, 20000);
            });
         }
      }

      var cssResult = this._manageStyles(opts.theme);
      if(cssResult.then) {
         resultBeforeMount = Promise.all([cssResult, resultBeforeMount]);
      }
      return resultBeforeMount;
   }

   /**
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
    * @private
    */
   public _afterMount(): void {
      // Do
   }

   /**
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
    * @private
    */

   public __beforeUpdate(options): void {
      if(options.theme !== this._options.theme) {
         this._manageStyles(options.theme, this._options.theme);
      }
      this._beforeUpdate.apply(this, arguments);
   }

   public _beforeUpdate(): void {
      // Do
   }

   /**
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
    * @private
    */
   public _shouldUpdate(): Boolean {
      return true;
   }

   /**
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
    * @private
    */
   public _afterUpdate(): void {
      // Do
   }

   /**
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
    * @private
    */
   public __beforeUnmount() {
      this._removeStyles(this._options.theme);
      this._beforeUnmount.apply(this, arguments);
   }

   public _beforeUnmount() {
      //Do
   }

   // </editor-fold>
}

Control.prototype._template = template;

export default Control;
