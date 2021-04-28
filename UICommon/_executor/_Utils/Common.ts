/// <amd-module name="UICommon/_executor/_Utils/Common" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

// @ts-ignore
import { constants, cookie } from 'Env/Env';

import * as RequireHelper from './RequireHelper';

import { pauseReactive } from '../pauseReactive';
import { IControl } from 'UICommon/interfaces';
import { IGeneratorNameObject } from '../_Markup/IGeneratorType';
import * as Attr from '../_Expressions/Attr';
import { TemplateFunction } from 'UICommon/Base';

var
   requireIfDefined = function requireIfDefined(tpl) {
      return RequireHelper.defined(tpl) && RequireHelper.require(tpl, true);
   },
   tryLoadLibraryModule = function tryLoadLibraryModule(tpl, _deps) {
      if (isLibraryModuleString(tpl)) {
         // if tpl is a library module name, check if the library is already loaded in _deps
         // or already defined with require
         var
            libPath = splitModule(tpl),
            library = _deps && _deps[libPath.library] || requireIfDefined(libPath.library);

         // if the library was found, return the requested module from it
         return library && extractLibraryModule(library, libPath.module);
      }
      return null;
   },
   /**
    * Стандартный резолвер для имен, которые передают в partial.
    * @param tpl
    * @param includedTemplates
    * @param _deps
    * @returns {*}
    */
   checkExistingModule = function checkExistingModule(tpl, includedTemplates, _deps) {
      return includedTemplates && includedTemplates[tpl]
         || _deps && (_deps[tpl] || _deps['optional!' + tpl])
         || requireIfDefined(tpl)
         || tryLoadLibraryModule(tpl, _deps);
   },
   moduleNameCheckProceed = function maxNameLengthCheck(tpl, includedTemplates, _deps) {
      return checkExistingModule(tpl, includedTemplates, _deps);
   },
   conventionalStringResolver = function conventionalStringResolver(tpl, includedTemplates?, _deps?) {
      if (tpl && tpl.length) {
         return moduleNameCheckProceed(tpl, includedTemplates, _deps);
      }
   };

export function isString(string: any): string is string {
   return (Object.prototype.toString.call(string) === '[object String]');
}

export function isArray(array: any): array is Array<any> {
   return (Object.prototype.toString.call(array) === '[object Array]');
}

const tagsToReplace = {
   '<': '&lt;',
   '>': '&gt;',
   "'": '&apos;',
   "\"": '&quot;',
   '{{': '&lcub;&lcub;',
   '}}': '&rcub;&rcub;'
};
const ampRegExp = /&([^#])/g;
const otherEscapeRegExp = /({{)|(}})|([<>'"])/g;

export function escape(entity) {
   if (isString(entity)) {
      entity = entity.replace(ampRegExp, function escapeReplace(tag, suffix) {
         return '&amp;' + suffix;
      });

      return entity.replace(otherEscapeRegExp, function escapeReplace(tag) {
         return tagsToReplace[tag] || tag;
      });
   }
   return entity;
}

// умеет конвертировать не только ansii символы, но и unicode
function fixedFromCharCode(codePt) {
   //Код может быть в 16тиричной форме
   if (codePt && codePt.indexOf){
      if (codePt.indexOf('x') === 0){
         var trueCode = codePt.split('x')[1];
         codePt = parseInt(trueCode, 16);
      }
   }
   if (codePt > 0xFFFF) {
      codePt -= 0x10000;
      return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
   } else {
      return String.fromCharCode(codePt);
   }
}

var unicodeRegExp = /&#(\w*);?/g;

export function unescapeASCII(str: any): any {
   if (typeof str !== 'string') {
      return str;
   }
   return str.replace(unicodeRegExp, (_, entity) => fixedFromCharCode(entity));
};

const unescapeRegExp = /&(nbsp|amp|quot|apos|lt|gt);/g;
const unescapeDict = {
   "nbsp": String.fromCharCode(160),
   "amp": "&",
   "quot": "\"",
   "apos": "'",
   "lt": "<",
   "gt": ">"
};

export function unescape(str: any): any {
   if (typeof str !== 'string') {
      return str;
   }
   return unescapeASCII(str).replace(unescapeRegExp, (_, entity: string) => unescapeDict[entity]);
};

const tagsToParenthesisReplace = {
   '{{': '&lcub;&lcub;',
   '}}': '&rcub;&rcub;'
};
const regExpToParenthesisReplace = /({{)|(}})/g;

// Для того чтобы при прогоне второй раз в dot, все конструкции эскейпились
export function escapeParenthesis(entity) {
   if (isString(entity)) {
      return entity.replace(regExpToParenthesisReplace, function escapeReplace(tag) {
         return tagsToParenthesisReplace[tag] || tag;
      });
   }
   return entity;
}

/**
 * Для поиска резолвера имен в конфине, если он есть.
 * @param name
 * @param resolvers
 * @returns {*}
 */
export function hasResolver(name, resolvers) {
   for (var resolver in resolvers) {
      if (resolvers.hasOwnProperty(resolver)) {
         return name.indexOf(resolver) === 0 ? resolver : undefined;
      }
   }
}

/**
 * Для использования найденного резолвера имен для partial
 * @param name
 * @param resolvers
 * @returns {*}
 */
export function findResolverInConfig(name, resolvers) {
   var resolverName = hasResolver(name, resolvers);
   if (resolverName) {
      return resolvers[resolverName];
   }
}

export function plainMerge(inner, object, cloneFirst?) {
   var copyInner = {},
      prop;
   if (typeof inner !== 'object' && typeof inner !== 'function') {
      inner = {};
   }
   if (!object) {
      object = {};
   }

   if (cloneFirst) {
      // pause reactive behaviour of properties while merging
      pauseReactive(copyInner, () => {
         for (prop in inner) {
            if (inner.hasOwnProperty(prop)) {
               copyInner[prop] = inner[prop];
            }
         }
      });
   } else {
      copyInner = inner;
   }

   // pause reactive behaviour of properties while merging
   pauseReactive(copyInner, () => {
      for (prop in object) {
         if (object.hasOwnProperty(prop)) {
            copyInner[prop] = object[prop];
         }
      }
   });

   return copyInner;
}

export function plainMergeAttr(inner, object) {
   if (!inner) {
      inner = {};
   }
   if (!object) {
      object = {};
   }

   /*
    * Атрибуты из шаблона не нужны в VDom контролах
    * */
   if (object.attributes && Object.keys(object.attributes).length === 2 && object.attributes['name'] === object.attributes['sbisname']
      && object.attributes['sbisname'] !== undefined) {
      object = {};
   }

   var controlKey;
   if (object.attributes && object.attributes['key']) {
      controlKey = object.attributes['key'];
   }
   controlKey = controlKey || object.key || inner.key;

   return {
      inheritOptions: object.inheritOptions,
      context: inner.context,
      internal: inner.internal,
      systemOptions: {},
      domNodeProps: {},
      key: controlKey,
      attributes: Attr.processMergeAttributes(inner.attributes, object.attributes),
      events: Attr.mergeEvents(inner.events, object.events)
   };
}

export function plainMergeContext(inner, object) {
   if (!inner) {
      inner = {};
   }
   if (!object) {
      object = {};
   }
   var controlKey;
   if (object.attributes && object.attributes['key']) {
      controlKey = object.attributes['key'];
   }
   controlKey = controlKey || object.key || inner.key;

   return {
      attributes: object.attributes || {},
      events: object.events || {},
      inheritOptions: inner.inheritOptions,
      internal: inner.internal,
      context: inner.context,
      key: controlKey
   };
}

export function isTemplateString(str) {
   return str.indexOf('wml!') === 0 || str.indexOf('tmpl!') === 0 || str.indexOf('html!') === 0 || str.indexOf('optional!tmpl!') === 0;
}

export function isControlString(str) {
   return str.indexOf('js!') === 0;
}

export function isOptionalString<T = unknown>(tplOrigin: T) {
   return typeof tplOrigin === 'string' && tplOrigin.indexOf('optional!') === 0;
}

export function isLibraryModuleString(str) {
   // library module string example: SomeStorage.Library:Module
   var name = str.indexOf('ws:') === 0 ? str.replace('ws:', '') : str;
   return /(([-_a-zA-Z0-9]+)[./]([-_a-zA-Z0-9]+)[:]([-_a-zA-Z0-9]+))$/.test(name);
}

// для обработки контролов без js, через partial
export function isSlashedControl(str) {
   return str.split('/').length > 1 && !isTemplateString(str) && str.indexOf('<') === -1 && str.indexOf(' ') === -1;
}

export function isStringModules(str, config?) {
   return isOptionalString(str) || isTemplateString(str) || isControlString(str) || isSlashedControl(str) || hasResolver(str, config && config.resolvers);
}

export function isControlClass<T = IControl>(controlClass: any): controlClass is T {
   const prototype = controlClass && controlClass.prototype;
   // Проверка на typeof добавлена в следствии странной ошибки https://inside.tensor.ru/opendoc.html?guid=872a7e36-7487-4362-88d0-eaf0e66cb6b6
   // По какой-то причине проверка controlClass && controlClass.prototype проходила и свойство $constructor вызывалось на undefined.
   if (prototype && typeof prototype !== 'undefined') {
      return prototype.$constructor || prototype._template || controlClass.isWasaby;
   }
   return false;
}

export interface ITemplateArray<K = TemplateFunction> extends Array<K> {
   isDataArray: boolean;
}

export function isTemplateClass<K = TemplateFunction>(controlClass: any): controlClass is K {
   const prototype = controlClass && controlClass.prototype;
   if (prototype && typeof prototype !== 'undefined') {
      return prototype.isWasabyTemplate || controlClass.isWasabyTemplate;
   }
   return false;
}
export function isTemplateArray<K = TemplateFunction>(array: any): array is ITemplateArray<K> {
   return Array.isArray(array) && array.hasOwnProperty('isDataArray') && (array as ITemplateArray<K>).isDataArray;
}

export function isControl(control) {
   return control && control.constructor && isControlClass(control.constructor);
}

export function isLibraryModule(cfg: any): cfg is IGeneratorNameObject {
   return cfg && cfg.library && cfg.module;
}

export function splitModule(string: string): IGeneratorNameObject {
   var
      fullName = string.indexOf('ws:') === 0 ? string.replace('ws:', '') : string,
      librarySplit = fullName.split(':', 2),
      libraryName = librarySplit[0],
      moduleName = librarySplit[1] && librarySplit[1].replace(/\//g, '.'),
      modulePath = moduleName.split('.');

   return {
      library: libraryName,
      module: modulePath,
      fullName: `${libraryName}:${moduleName}`
   };
}

export function extractLibraryModule(library, modulePath, extendedLibrary?) {
   let mod = library;
   modulePath.forEach(function (part) {
      if (mod && typeof mod === 'object' && part in mod) {
         mod = mod[part];
      } else if (extendedLibrary && typeof extendedLibrary === 'object' && part in extendedLibrary)
         mod = extendedLibrary[part];
      else {
         throw new Error('Module "' + modulePath.join('.') + '" does not exist in the specified library');
      }
   });
   return mod;
}

export function splitOptional(string) {
   var ws;
   ws = string.split('optional!');
   return ws[1];
}

export function splitWs(string: string): string {
   let ws;
   if (string !== undefined && string.indexOf('ws:') === 0) {
      ws = string.split('ws:');
      return ws[1];
   }
   return string;
}

export function isCompound(ctor) {
   //CompoundControl на прототипе не имеет $constructor, и контролы, унаследовавшиеся от него и не переопределившие
   //$constructor не пройдут эту проверку. Поэтому добавлено поле _isCoreCompound.
   return (ctor.prototype.$constructor && !ctor.prototype._template) || ctor.prototype._dotTplFn || ctor.prototype._isCoreCompound;
}

export function isNewControl(ctor) {
   return !isCompound(ctor);
}

/**
 * Объект с зависимостями контрола/шаблона.
 */
export type Deps<T = IControl, K = TemplateFunction> = Record<string, T | K | IDefaultExport<T>>;

export type IncludedTemplates<K = TemplateFunction> = Record<string, K>;
/**
 * Если результат с optional === false, попробуем без optional!
 * @param tpl
 * @param includedTemplates
 * @param _deps
 * @returns {*}
 */
export function depsTemplateResolver<T = IControl, K = TemplateFunction>(
    tpl: string,
    includedTemplates: IncludedTemplates<K>,
    _deps: Deps<T, K>): T | K | IDefaultExport<T> {
   const newName = splitWs(tpl);
   var result = conventionalStringResolver(newName, includedTemplates, _deps);
   if (isOptionalString(newName) && !result) {
      result = conventionalStringResolver(splitOptional(newName));
   }
   if (isDefaultExport<T>(result)) {
      result = result.default;
   }
   return result;
}

export function fixDefaultExport<T = IControl, K = unknown>(tplOrigin: K | IDefaultExport<T>): K | T {
   // При использовании ts-модуля, где нужный класс экспортируется дефолтно, внутри js-модуля
   // сюда приходит объект tplOrigin, где __esModule есть true, а в default лежит нужная нам
   // функция построения верстки
   // Для того, чтобы верстка строилась, необходимо вытащить функцию из default
   return isDefaultExport(tplOrigin) ? (tplOrigin as IDefaultExport<T>).default : tplOrigin as K;
}

export interface IDefaultExport<T = IControl> {
   __esModule: boolean;
   default: T;
}
/**
 * Либо сужает тип obj до IDefaultExport, либо однозначно говорит, что это другой тип.
 * @param obj
 */
function isDefaultExport<T = IControl>(obj: unknown): obj is IDefaultExport<T> {
   if (obj && typeof obj === 'object') {
      return obj.hasOwnProperty('__esModule') && obj.hasOwnProperty('default');
   }
   return false;
}

export function isCompat() {
   if (constants.isServerSide && typeof process !== 'undefined') {
      // @ts-ignore
      return !process.domain || process.domain.req && process.domain.req.compatible !== false;
   } else {
      return constants.compat;
   }
}

export function isAnonymousFn(fn) {
   return typeof fn === 'function' && fn.name === '';
}

let disableCompatCache;
export function disableCompat() {
   let disableCompat = (process && process.domain && process.domain.req.disableCompat) || disableCompatCache;
   if (typeof disableCompat === 'undefined') {
      disableCompat = cookie.get('disableCompat');
      if (constants.isServerSide && typeof process !== 'undefined') {
         if (process && process.domain && process.domain.req) {
            process.domain.req.disableCompat = disableCompat;
         }
      } else {
         disableCompatCache = disableCompat;
      }
   }
   return typeof(disableCompat) !== "undefined" && disableCompat === 'true' ;
}

//todo перенести в Serializer
export const componentOptsReArray = [
   {
      toFind: /\\/g, // экранируем слеш первым
      toReplace: '\\\\'
   },
   {
      toFind: /<\/(script)/gi,
      toReplace: '<\\/$1'
   },
   {
      toFind: /'/g,
      toReplace: '\\u0027'
   },
   {
      toFind: /\u2028/g,
      toReplace: '\\u000a'
   },
   {
      toFind: /\u2029/g,
      toReplace: '\\u000a'
   },
   {
      toFind: /\n/g,
      toReplace: '\\u000a'
   },
   {
      toFind: /\r/g,
      toReplace: '\\u000d'
   },
   {
      toFind: /[^\\]\\u000a/g,
      toReplace: '\\\\u000a'
   }
];
