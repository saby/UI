/// <amd-module name="UICore/_contexts/ContextResolver" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

import { Logger } from 'UICore/Utils';

const whiteList = {
   "UserActivity/ActivityContextField": true,
   "Notes/VDOM/Context": true,
   "Controls/Application/AppData": true,
   "Controls/Container/Scroll/Context": true,
   "Controls/Context/TouchContextField": true,
   "Controls/_context/TouchContextField": true,
   "Controls/StickyHeader/Context": true,
   "Controls/_scroll/StickyHeader/Context": true,
   "Controls/_scroll/Scroll/Context": true,
   "Controls/Container/Data/ContextOptions": true,
   "Controls/_context/ContextOptions": true,
   "Controls/_lookupPopup/__ControllerContext": true,
   "Controls/Container/Filter/FilterContextField": true,
   "Controls/_context/FilterContextField": true,
   "Controls/Container/Search/SearchContextField": true,
   "Controls/_context/SearchContextField": true,
   "Controls/Filter/Button/Panel/Wrapper/_FilterPanelOptions": true,
   'Controls/_filterPopup/Panel/Wrapper/_FilterPanelOptions': true,
   "Controls/_suggestPopup/_OptionsField": true,
   "Controls/_dateRange/DateRangeContext": true,
   "WSTests/unit/tmpl/sync-tests/context/contextField": true,
   "WSTests/unit/tmpl/sync-tests/context/updateConsumers/ctxField": true,
   "WSTests/unit/tmpl/sync-tests/context/contextField2": true,
   "WSTests/unit/tmpl/sync-tests/context/dirtyCheckingUpdate/contextField": true,
   "Controls/scroll:_scrollContext": true,
   "Controls/scroll:_stickyHeaderContext": true,
   "UI/State:AppData": true
};

function compositeGetVersion() {
   var version = 0;
   for (var key in this) {
      if (this.hasOwnProperty(key) && this[key]) {
         if (this[key].getVersion) {
            version += this[key].getVersion();
         }
      }
   }
   return version;
}

export function wrapContext(inst, currentCtx) {
   if (inst && inst._getChildContext) {
      currentCtx = Object.create(currentCtx);
      var ctx = inst._getChildContext();
      for (var i in ctx) {
         if (ctx.hasOwnProperty(i)) {
            if (ctx[i] && ctx[i]._moduleName && !whiteList[ctx[i]._moduleName]) {
               const message = `[UICore/_contexts/ContextResolver:wrapContext()] Wrong context field "${ctx[i]._moduleName}". Only allowed context fields: ${Object.keys(whiteList)}`;
               Logger.error(message, inst);
            }
            currentCtx[i] = ctx[i];
            if (ctx[i] && ctx[i].getVersion !== compositeGetVersion) {
               for (var j in ctx[i]) {
                  if (ctx[i].hasOwnProperty(j) && ctx[i][j]) {
                     if (ctx[i][j].getVersion) {
                        ctx[i].getVersion = compositeGetVersion;
                     }
                  }
               }
            }
         }
      }
   }
   return currentCtx;
}

export function resolveContext(controlClass, currentContext, control?) {
   if (typeof currentContext === 'undefined') {// Корневая нода. Не может быть контекста
      return {};
   }
   var contextTypes = controlClass.contextTypes ? controlClass.contextTypes() : {};
   var resolvedContext = {};
   if (!contextTypes) {
      const message = '[UICore/_contexts/ContextResolver:resolveContext()] Context types are not defined';
      Logger.error(message, control ? control : null);
   } else {
      for (var key in contextTypes) {
         if (!(key in currentContext)) {
            resolvedContext[key] = contextTypes[key];
         }
         if (!(currentContext[key] instanceof contextTypes[key])) {
            // Logger.error('Wrong context field: ' + key + ' === ' + currentContext[key] + ' should be type of ' + contextTypes[key].prototype._moduleName, controlClass.prototype);
            // resolvedContext[key] = null;
         } else {
            resolvedContext[key] = currentContext[key];
            if (control) {
               resolvedContext[key].registerConsumer(control);
            }
         }
      }
   }
   return resolvedContext;
}
