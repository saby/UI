/// <amd-module name="UICore/_executor/_Utils/OptionsResolver" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

// @ts-ignore
import { constants } from 'Env/Env';
// @ts-ignore
import { Logger } from 'UICommon/Utils';
import { TControlConstructor } from 'UICore/Base';

/**
 * Применить дефолтные опции конструктора
 * @param cfg
 */
export function resolveDefaultOptions(cfg, defaultOptions) {
   for (var key in defaultOptions) {
      if (typeof cfg[key] === 'undefined' && typeof defaultOptions[key] !== 'undefined') {
         cfg[key] = defaultOptions[key];
      }
   }
   return cfg;
}

function _validateOptions(controlClass: TControlConstructor, cfg, optionsTypes): void {
   Object.keys(optionsTypes).forEach((key) => {
      // @ts-ignore
      const result = optionsTypes[key].call(null, cfg, key, controlClass._moduleName);
      if (result instanceof Error) {
         const message = `"${key}" option error"`;

         Logger.error(message, controlClass.prototype, result);
      }
   });
}

export function resolveOptions(controlClass: TControlConstructor, defaultOpts, cfg) {
   resolveDefaultOptions(cfg, defaultOpts);
   validateOptions(controlClass, cfg);
}

export function getDefaultOptions(controlClass) {
   // нужно именно своё свойство defaultProps, чтобы случайно не взять с родителя
   const defaultProps = controlClass.hasOwnProperty('defaultProps') ? controlClass.defaultProps : undefined;
   if (typeof defaultProps === 'object' && defaultProps !== null) {
      return defaultProps;
   }
   if (controlClass.getDefaultOptions) {
      /*
      В прикладных репах изменения попали только в 2100, поэтому до 2100 вместо ошибки кидаю предупреждение.
      По задаче поменяю на ошибку:
      https://online.sbis.ru/opendoc.html?guid=17c93482-eab6-4f43-be1f-8f244490d2cf
       */
      if (controlClass.hasOwnProperty('getDefaultOptions')) {
         Logger.warn('Метод getDefaultOptions устарел, используйте статическое поле defaultProps.', controlClass.prototype);
      }
      return controlClass.getDefaultOptions();
   }
   return {};
}

export function validateOptions(controlClass, cfg): void {
    // @ts-ignore
   if (!!constants.isProduction) { // Disable options validation in production-mode to optimize
      return;
   }

   const optionsTypes = controlClass.getOptionTypes && controlClass.getOptionTypes();
   if (optionsTypes) {
      _validateOptions(controlClass, cfg, optionsTypes);
   }
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
      }
   }
   attrs.inheritOptions = newInherit;
}
