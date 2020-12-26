/// <amd-module name="UI/_executor/TClosure" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

// @ts-ignore
import { Serializer } from 'UI/State';
// @ts-ignore
import { Logger } from 'UI/Utils';
// @ts-ignore
import {Config as config} from 'UI/BuilderConfig';
// @ts-ignore
import { ObjectUtils } from 'UI/Utils';
import { object } from 'Types/util';
// @ts-ignore
import { constants } from 'Env/Env';

import { Text, Vdom } from './Markup';
import * as Scope from './_Expressions/Scope';
import * as Attr from './_Expressions/Attr';
import { Common, ConfigResolver } from './Utils';

var decorators;
function getDecorators() {
   if (decorators) {
      return decorators;
   } else {
      // eslint-disable-next-line
      // @ts-ignore
      decorators = require('View/decorators');
      return decorators;
   }
}

let generatorCompatible;
function getGeneratorCompatible(config) {
   if (generatorCompatible) {
      return generatorCompatible;
   } else {
      //@ts-ignore
      if (require.defined('View/ExecutorCompatible')) {
         // eslint-disable-next-line
         generatorCompatible = require('View/ExecutorCompatible').Compatible(config);
         return generatorCompatible;
      } else {
         // FIXME: сейчас на СП всегда стоит флаг совместимости
         // Logger.warn('View/ExecutorCompatible не загружен. Проверьте загрузку слоя совместимости.');
         return false;
      }
   }
}

function isObject(obj: any): boolean {
   return Object.prototype.toString.call(obj) === '[object Object]';
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
         return ObjectUtils.isPlainObject(ent);
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
   getter = function getter(obj, path) {
      lastGetterPath = path;
      return object.extractValue(obj, path);
   },

   /**
    * Set name property on object to value.
    *
    * @param obj
    * @param path
    * @param value
    */
   setter = function setter(obj, path, value) {
      return object.implantValue(obj, path, value);
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
   createGenerator = function (isVdom, forceCompatible = false, config) {
      if (isVdom) {
         return Vdom(config);
      }
      if (!Common.disableCompat() && (Common.isCompat() || forceCompatible)) {
         const Compatible = getGeneratorCompatible(config);
         if (Compatible) {
            return Compatible;
         }
      }
      return Text(config);
   },
   // todo добавлено для совместимости с прошлой версией, можно будет удалить после выполнения задачи
   // https://online.sbis.ru/opendoc.html?guid=0443ec3f-0d33-469b-89f1-57d208ed2982
   // @ts-ignore
   getMarkupGenerator = function() {
      return this.createGenerator.apply(this, arguments);
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
   },
   getRk = function(fileName) {
      var localizationModule = fileName.split('/')[0];
      this.getRkCache = this.getRkCache || {};
      var rk = this.getRkCache[localizationModule] || requirejs("i18n!" + localizationModule);
      this.getRkCache[localizationModule] = rk;
      return rk;
   };

const isolateScope = Scope.isolateScope;
const createScope = Scope.createScope;
const presetScope = Scope.presetScope;
const uniteScope = Scope.uniteScope;
const calcParent = ConfigResolver.calcParent;
const processMergeAttributes = Attr.processMergeAttributes;
const plainMerge = Common.plainMerge;
const plainMergeAttr = Common.plainMergeAttr;
const plainMergeContext = Common.plainMergeContext;
const _isTClosure = true;

export {
   isolateScope,
   createScope,
   presetScope,
   uniteScope,
   createDataArray,
   filterOptions,
   calcParent,
   wrapUndef,
   getDecorators,
   sanitizeContent as Sanitize,
   ITERATORS as iterators,
   templateError,
   partialError,
   makeFunctionSerializable,
   getter,
   setter,
   config,
   processMergeAttributes,
   plainMerge,
   plainMergeAttr,
   plainMergeContext,
   getTypeFunction as getTypeFunc,
   createGenerator,
   getMarkupGenerator,
   validateNodeKey,
   getRk,
   _isTClosure
};
