/// <amd-module name="UI/_executor/TClosure" />
/* tslint:disable */

// @ts-ignore
import { Serializer } from 'UI/State';
// @ts-ignore
import { IoC } from 'Env/Env';
// @ts-ignore
import { Logger } from 'UI/Utils';
// @ts-ignore
import {Config as config} from 'UI/Builder';
// @ts-ignore
import { Object } from 'UI/Utils';

import { Text, Vdom } from './Markup';
import { _FocusAttrs } from 'UI/Focus';
import * as Scope from './_Expressions/Scope';
import * as Attr from './_Expressions/Attr';
import { Common, ConfigResolver } from './Utils';

var decorators;
function getDecorators() {
   if (decorators) {
      return decorators;
   } else {
      // @ts-ignore
      decorators = require('View/decorators');
      return decorators;
   }
}

let generatorCompatible;
function getGeneratorCompatible() {
   if (generatorCompatible) {
      return generatorCompatible;
   } else {
      //@ts-ignore
      if (require.defined('View/ExecutorCompatible')) {
         generatorCompatible = require('View/ExecutorCompatible').GeneratorCompatible;
         return generatorCompatible;
      } else {
         // FIXME: сейчас на СП всегда стоит флаг совместимости
         // Logger.warn('View/ExecutorCompatible не загружен. Проверьте загрузку слоя совместимости.');
         return false;
      }
   }
}


const ITERATORS = [
   {
      type: 'recordset',
      is: function isRecordset(ent) {
         return ent && Object.prototype.toString.call(ent.each) === '[object Function]';
      },
      iterator: function recordsetIterator(recordset, callback) {
         recordset.each(callback);
      }
   },
   {
      type: 'array',
      is: function isArray(ent) {
         return ent instanceof Array;
      },
      iterator: function arrayIterator(array, callback) {
         var i, ln = array.length;
         for (i = 0; i !== ln; i++) {
            callback(array[i], i);
         }
      }
   },
   {
      type: 'object',
      is: function isObject(ent) {
         return Object.isPlainObject(ent);
      },
      iterator: function objectIterator(object, callback) {
         for (var key in object) {
            if (object.hasOwnProperty(key)) {
               callback(object[key], key);
            }
         }
      }
   },
   {
      type: 'int',
      is: function isInt(n) { return parseInt(n) === n },
      iterator: function intIterator(number, callback) {
         for (var i = 0; i < number; i++) {
            callback(i, i);
         }
      }
   }
];

var lastGetterPath;
var
   getter = function getter(obj, path, viewController) {
      lastGetterPath = path;
      for (var i = 0; i < path.length; i++) {
         var name = path[i];

         if (obj != undefined) {
            if (obj.has && obj.get && obj.has(name)) {
               // Чтобы можно было звать дефолтные свойства модели
               obj = obj.get(name);
            } else {

               /**
                * if we want get "_options" field
                * we maybe want all fields from current scope
                * It is actual for stateless wml files
                */
               if (name !== '_options' || obj[name]) {

                  const error = obj['_$' + name];
                  if (error instanceof ConfigResolver.UseAutoProxiedOptionError) {
                     if (!error.isDestroyed()) {
                        Logger.error(`Попытка использовать опцию, которой не существует: ${path.slice(0, i+1).join('.')}
                           При вставке контрола/шаблона эта опция не была явно передана, поэтому в текущем дочернем контроле ее использовать нельзя.
                           Передача опции не произошла в шаблоне контрола: ${error.upperControlName}.
                           Вставляемый контрол/шаблон, в котором должна явно передаваться опция: ${error.lostHere}.
                           Попытка использовать опцию`, viewController);
                        error.destroy();
                     }
                  }

                  obj = obj[name];
               }
            }
         } else {
            return undefined;
         }
      }

      return obj;
   },

   /**
    * Set name property on object to value.
    *
    * @param obj
    * @param path
    * @param value
    */
   setter = function setter(obj, path, viewController, value) {
      var
         lastPathPart = path.pop(),
         lastObj = getter(obj, path, null);

      if (lastObj) {
         if (lastObj.set) {
            lastObj.set(lastPathPart, value);
         } else {
            lastObj[lastPathPart] = value;
         }
         return true;
      }
      return false;
   },
   isFunction = function isFunction(fn) {
      return Object.prototype.toString.call(fn) === '[object Function]';
   },
   isObject = function isObject(fn) {
      return Object.prototype.toString.call(fn) === '[object Object]';
   },
   wrapUndef = function wrapUndef(value) {
      if (value === undefined || value === null) {
         return "";
      } else {
         if (checkPinTypes(value)) {
            return pinTypes[value._moduleName](value);
         }
         return value;
      }
   },
   getTypeFunction = function (name, arg) {
      var res = Serializer.getFuncFromDeclaration(name ? name.trim() : name);
      if (typeof res === 'function' && Object.keys(arg).length) {
         res = res.bind(undefined, arg);
      }
      if (typeof res !== 'function') {
         Logger.error(`Function "${name}" has not been loaded yet! Add this function to the module definition`);
      }
      return res;
   },
   enumTypePin = function typeEnum(value) {
      return String(value);
   },
   // Коллекция типов для которых нужен особый вывод
   pinTypes = {
      'Types/collection:Enum': enumTypePin,
      'Data/collection:Enum': enumTypePin,
      'Data/_collection/Enum': enumTypePin,
      'WS.Data/Type/Enum': enumTypePin
   },

   /**
    * Calls function to set value for binding.
    *
    * @param event
    * @param value
    * @param fn
    */
   bindProxy = function (event, value, fn) {
      fn.call(this, value);
   },

   checkPinTypes = function checkPinTypes(value) {
      return value && value._moduleName && pinTypes.hasOwnProperty(value._moduleName);
   },
   isForwardableOption = function (optionName) {
      return optionName !== 'name';
   },
   filterOptions = function (scope) {
      // TODO: покрыть тестами, нет юнитов
      var filteredScope = {};

      if (!isObject(scope)) {
         return scope;
      }

      // Only keep options that are forwardable. Do not forward ones that
      // identify a specific instance, for example `name`
      for (var key in scope) {
         if (isForwardableOption(key)) {
            filteredScope[key] = scope[key];
         }
      }

      return filteredScope;
   },
   templateError = function error(filename, e, data) {
      if (lastGetterPath && e.message.indexOf('apply') > -1) {
         e = new Error("Field " + lastGetterPath.toString().replace(/,/g, '.') + ' is not a function!');
      }

      Logger.templateError('Failed to generate html', filename, data, e);
   },
   partialError = function partialError() {
      try {
         if (typeof window !== 'undefined') {
            // явно указываем откуда ошибка, чтобы понять откуда начинать отладку в случае проблем
            throw new Error('[UI/Executor/TClosure:partialError()]');
         }
      } catch (err) {
         Logger.error('Использование функции в качестве строковой переменной! Необходимо обернуть в тег ws:partial', null, err);
      }
   },
   createGenerator = function (isVdom, forceCompatible = false) {
      if (isVdom) {
         return new Vdom();
      }
      if (Common.isCompat() || forceCompatible) {
         const Compatible = getGeneratorCompatible();
         if (Compatible) {
            return new Compatible();
         }
      }
      return new Text();
   },
   makeFunctionSerializable = function makeFunctionSerializable(func, scope) {
      var funcStr = '';
      if (typeof window === 'undefined') {
         funcStr = func.toString();
      }
      func = func.bind(scope);
      func.toStringOrigin = func.toString;
      func.toString = function () {

         if (typeof window === 'undefined' && funcStr.indexOf('createControl') > -1) {
            partialError();
         }
         return func(this);
      }.bind(scope);

      if (typeof window === 'undefined') {
         func.toJSON = function () {
            return "TEMPLATEFUNCTOJSON=" + funcStr;
         };
      }
      return func;
   },
   // Пока не избавимся от всех использований concat для массивных опций
   // нужно вещать toString на них
   createDataArray = function createDataArray(array, templateName, isWasabyTemplate) {
      Object.defineProperty(array, 'isDataArray', {
         value: true,
         configurable: true,
         enumerable: false,
         writable: true
      });
      Object.defineProperty(array, 'isWasabyTemplate', {
         value: !!isWasabyTemplate,
         configurable: true,
         enumerable: false,
         writable: true
      });
      Object.defineProperty(array, 'toString', {
         value: function() {
            Logger.templateError(
               "Использование контентной опции компонента или шаблона в качестве строки. " +
               "Необходимо использовать контентные опции с помощью конструкции ws:partial или " +
               "обратитесь в отдел Инфраструктура представления", templateName);
            return this.join("");
         },
         configurable: true,
         enumerable: false,
         writable: true
      });

      return array;
   },
   // Существует пока есть второй прогон dot на препроцессоре
   sanitizeContent = function sanitizeContent(content) {
      // @ts-ignore
      var Sanitize = require('Core/Sanitize');
      var opts = getDecorators()._sanitizeOpts();

      // экранируем скобки только если код выполняется в сервисе представления, только там может dot дважды эскейпиться
      // @ts-ignore
      if (typeof process !== 'undefined' && !process.versions) {
         content = Common.escapeParenthesis(content);
      }

      return Sanitize(content, opts);
   },
   // Ключи виртуальных нод могут переопределяться пользователем
   // Мы должны проверить тип и значение ключа.
   // Одно из требований должно выполняться:
   // * ключ является непустой строкой,
   // * ключ является конечным числом
   validateNodeKey = function validateNodeKey(key): number | string {
      if (key || key === 0) {
         return key;
      }
      // Вернемся к валидации ключей позднее
      // if (typeof key === 'string' && key || typeof key === 'number' && isFinite(key)) {
      //    return key;
      // }
      // if (isArray(key) && key.length > 0) {
      //    return key.map(value => `${value}`).toString();
      // }
      return '_';
   };

const isolateScope = Scope.isolateScope;
const createScope = Scope.createScope;
const presetScope = Scope.presetScope;
const uniteScope = Scope.uniteScope;
const calculateScope = Scope.calculateScope;
const calcParent = ConfigResolver.calcParent;
const plainMerge = Common.plainMerge;
const plainMergeAttr = Common.plainMergeAttr;
const plainMergeContext = Common.plainMergeContext;
const prepareAttrsForFocus = _FocusAttrs.prepareAttrsForFocus;
const _isTClosure = true;

export {
   isolateScope,
   createScope,
   presetScope,
   uniteScope,
   calculateScope,
   createDataArray,
   filterOptions,
   ConfigResolver as configResolver,
   calcParent,
   wrapUndef,
   getDecorators,
   sanitizeContent as Sanitize,
   ITERATORS as iterators,
   templateError,
   partialError,
   makeFunctionSerializable,
   isFunction,
   getter,
   setter,
   IoC,
   config,
   Common as utils,
   plainMerge,
   plainMergeAttr,
   plainMergeContext,
   getTypeFunction as getTypeFunc,
   createGenerator,
   bindProxy,
   isObject,
   prepareAttrsForFocus,
   Attr as attrExpressions,
   validateNodeKey,
   _isTClosure
};
