/// <amd-module name="UI/_executor/_Utils/OptionsResolver" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

// @ts-ignore
import { constants } from 'Env/Env';
// @ts-ignore
import { Logger } from 'UI/Utils';
import { UseAutoProxiedOptionError } from './ConfigResolver';
import { TControlConstructor } from 'UI/_base/Control'

/**
 * Применить дефолтные опции конструктора
 * @param cfg
 */
export function resolveDefaultOptions(cfg, defaultOptions) {
   for (var key in defaultOptions) {
      if (typeof cfg[key] === 'undefined' && typeof defaultOptions[key] !== 'undefined') {
         cfg[key] = defaultOptions[key];
         if (cfg['_$'+key] instanceof UseAutoProxiedOptionError) {
            cfg['_$'+key].destroy();
         }
      }
   }
   return cfg;
}

function _validateOptions(controlClass: TControlConstructor, cfg, optionsTypes, parentName: string): boolean {
   let targetMessage = '';
   if (cfg['name']) {
      targetMessage = ` of "${cfg['name']}"`;
   }
   for (var key in optionsTypes) {
      var result = optionsTypes[key].call(null, cfg[key]);
      if (result instanceof Error) {
         let message = `"${key}" option error${targetMessage}, parent name: "${parentName}"`;

         Logger.error(message, controlClass.prototype, result);
         return false;
      }
   }
   return true;
}

export function resolveOptions(controlClass: TControlConstructor, defaultOpts, cfg, parentName: string) {
   resolveDefaultOptions(cfg, defaultOpts);
   return validateOptions(controlClass, cfg, parentName);
}

export function getDefaultOptions(controlClass) {
   return controlClass.getDefaultOptions ? controlClass.getDefaultOptions() : {};
}

export function validateOptions(controlClass, cfg, parentName: string): boolean {
    // @ts-ignore
   if (!!constants.isProduction) { // Disable options validation in production-mode to optimize
      return true;
   }

   var optionsTypes = controlClass.getOptionTypes && controlClass.getOptionTypes();
   return _validateOptions(controlClass, cfg, optionsTypes, parentName);
}

export function resolveInheritOptions(controlClass, attrs, controlProperties, fromCreateControl?) {
   if (!controlClass) {
      return;
   }
   var inheritOptions = (controlClass._getInheritOptions && controlClass._getInheritOptions(controlClass)) || {};

   if (!attrs.inheritOptions) {
      attrs.inheritOptions = {};
   }

   var newInherit = {};
   for (var i in attrs.inheritOptions) {
      if (attrs.inheritOptions.hasOwnProperty(i)) {
         if (controlProperties[i] === undefined) {
            controlProperties[i] = attrs.inheritOptions[i];

            if (controlProperties['_$'+i] instanceof UseAutoProxiedOptionError) {
               controlProperties['_$'+i].destroy();
            }
         }
         newInherit[i] = controlProperties[i];
      }
   }
   for (var j in inheritOptions) {
      if (inheritOptions.hasOwnProperty(j) && !newInherit.hasOwnProperty(j)) {
         if (controlProperties.hasOwnProperty(j)) {
            inheritOptions[j] = controlProperties[j];
         }
         newInherit[j] = inheritOptions[j];
         controlProperties[j] = inheritOptions[j];

         if (controlProperties['_$'+j] instanceof UseAutoProxiedOptionError) {
            controlProperties['_$'+j].destroy();
         }
      }
   }
   attrs.inheritOptions = newInherit;
}
