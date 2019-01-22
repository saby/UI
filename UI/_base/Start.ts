/// <amd-module name="UI/_base/Start" />

import Control from 'UI/_base/Control';
import * as Request from 'View/Request';

function createControl(control, config, dom) {
   let configReady = config||{};
   if (typeof window && window.wsConfig){
      for (var i in window.wsConfig){
         if (window.wsConfig.hasOwnProperty(i)) {
            configReady[i] = window.wsConfig[i];
         }
      }
   }
   let _getChildContext = control.prototype._getChildContext;
   control.prototype._getChildContext = function(){
      var base = _getChildContext?_getChildContext.call(this):{};
      if (typeof window && window.startContextData){
         for (var i in window.startContextData){
            if (window.startContextData.hasOwnProperty(i) && !base.hasOwnProperty(i)) {
               base[i] = window.startContextData[i];
            }
         }
      }
      return base;
   };
   Control.createControl(control, configReady, dom);
}

function startFunction(config) {
   if (typeof window !== 'undefined' && window.receivedStates) {
      //для совместимости версий. чтобы можно было влить контролы и WS одновременно
      let sr = Request.getCurrent().stateReceiver;
      sr && sr.deserialize(window.receivedStates);
   }

   let dom = document.getElementById('root');
   let dcomp = dom.attributes["rootapp"];
   if (dcomp) {
      dcomp = dcomp.value;
   }
   let module = '';

   if (dcomp && dcomp.indexOf(':') > -1) {
      dcomp = dcomp.split(':');
      module = dcomp[1];
      dcomp = dcomp[0];
   }
   require([dcomp||undefined, dom.attributes["application"].value], function(result, component) {
      if (result) {
         if (module) {
            result = result[module];
         }
         config = config || {};
         config.application = dom.attributes["application"].value;
      }
      config.buildnumber = window.buildnumber;
      createControl(result || component, config, dom);
   });
};

export default startFunction;
