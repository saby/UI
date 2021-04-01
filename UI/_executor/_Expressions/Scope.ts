/// <amd-module name="UI/_executor/_Expressions/Scope" />
/* tslint:disable */
/**
 * @author Тэн В.А.
 */
import { ReactiveObserver } from 'UI/Reactivity';

/**
 * Набор свойств, которые необходимо не переопределять, а конкатенировать.
 * Актуально при объединении scope-объектов.
 */
const concatProperties = [
   'className'
];

/**
 * Флаг на scope-объекте, которое содержит имя свойства,
 * по которому производилась изоляция.
 */
const ISOLATED_SCOPE_FLAG = '___$isolatedscope';

/**
 * Флаг на scope-объекте, которое содержит оригинальный scope-объект,
 * по которому производилась объединение.
 */
const ORIGIN_FLAG = '__$$__originObject';

/**
 * Префикс флага на scope-объекте, говорящий о том, что была выполнена изоляция по свойству PROP_NAME.
 * Имя флага в таком случае: ___$patched$PROP_NAME
 * FIXME: уточнить
 */
const PATCHED_FLAG_PREFIX = '___$patched$';

/**
 * Префикс флага на scope-объекте, говорящий о том, что на момент изоляции scope по свойству PROP_NAME,
 * целевой scope-объект еще не был определен.
 * Имя флага в таком случае: ___$wasundef$PROP_NAME
 * FIXME: уточнить
 */
const UNDEF_FLAG_PREFIX = '___$wasundef$';

/**
 * Флаг на scope-merge-функции, говорящий о том, что пришел не scope-объект, а функция для обработки scope-объекта.
 */
const UNITE_FLAG = '__$unite';

function isObject(obj: any): boolean {
   return Object.prototype.toString.call(obj) === '[object Object]';
}

function replaceOrUnite(valueInner: any, valueOuter: any, prop: any): any {
   if (concatProperties.indexOf(prop) > -1 && valueInner && valueOuter) {
      return valueInner + ' ' + valueOuter;
   }
   return valueOuter;
}

function controlPropMerge(inner: any, object: any): any {
   if (!inner) {
      inner = {};
   }
   for (let prop in object) {
      if (object.hasOwnProperty(prop)) {
         inner[prop] = replaceOrUnite(inner[prop], object[prop], prop);
      }
   }
   return inner;
}

/**
 * После uniteScope нужно понять какую функцию мерджа вызвать
 * Позвать её или вернуть просто объект, если ничего
 * мерджить не нужно
 * @param scope
 * @param mergeFn
 * @returns {*}
 */
function calculateScope(scope: any, mergeFn: any): any {
   if (scope instanceof Function && scope[UNITE_FLAG]) {
      return scope(mergeFn);
   }
   return scope;
}

function isolateScope(scope: any, data: any, propertyName: any): any {
   if (!scope[PATCHED_FLAG_PREFIX + propertyName]) {
      let parentValueProperty = scope[propertyName];
      if (parentValueProperty !== undefined) {
         if (isObject(data)) {
            data = { ...scope };
         }
         data[propertyName] = parentValueProperty;
      } else {
         scope[UNDEF_FLAG_PREFIX + propertyName] = true;
      }
      // pause reactive behaviour of properties while scope initializing
      ReactiveObserver.pauseReactive(scope, () => {
         scope[propertyName] = data;
      });
      scope[PATCHED_FLAG_PREFIX + propertyName] = true;
   } else {
      if (!scope[UNDEF_FLAG_PREFIX + propertyName]) {
         if (isObject(data)) {
            data = Object.create(data);
         }
         data[propertyName] = scope[propertyName][propertyName];
      }
      // pause reactive behaviour of properties while scope initializing
      ReactiveObserver.pauseReactive(scope, () => {
         scope[propertyName] = data;
      });
   }
   scope[ISOLATED_SCOPE_FLAG] = propertyName;
   return scope;
}

/**
 * Функция используется только в цикле for
 * тот объект, который возвращается здесь
 * будет пропатчен внутри итератора, как объект.
 * Как модель его патчить нельзя (то есть, вызывать set),
 * а значит сделаем из модели обычный объект
 */
function createScope(scope: any): object {
   return Object.create(scope && scope._getRawData ? scope._getRawData() : (scope || null));
}

/**
 * Переменные цикла for([key, ] value in collection).
 */
interface CycleIdentifiers {
   value: string;
   key?: string;
}

function presetScope(object: any, data: any, key: any, firstArgument: CycleIdentifiers): any {
   // pause reactive behaviour of properties while scope initializing
   ReactiveObserver.pauseReactive(data, () => {
      if (firstArgument.key) {
         data[firstArgument.key] = key;
      }
      data[firstArgument.value] = object;
   });
   return data;
}


/**
 * Замыкает опции для partial. Нужен для того
 * чтобы отличить мердж опций компонента от простого шаблона
 * @param inner
 * @param outer
 * @returns {reshaper}
 */
function uniteScope(inner: any, outer: any): Function {
   let reshaper = function reshaper(mergeFn) {
      /**
       * inner здесь - это "внешний" scope
       * при создадии 2х контролов последовательно с одинм scope,
       * опции переопределнные для первого не должны попадать в опции второго контрола
       */

      let obj;
      if (typeof inner === 'object') {
         /**
          * Создаем новый объект от текущего, чтобы не портить
          * текущий для следующих использований и сохранить весь scope
          *
          * А также перенесем данные из inner в obj, чтобы не отвалились компоненты,
          * которые проверяют наличие scope первого уровня по hasOwnProperty
          * НЕ ТОЛЬКО!. ЭТА ШТУКА НУЖНА, ИНАЧЕ ПРИ СОЗДАНИИ КОНТРОЛА/partial со SCOPE={{obj}} - объект
          * полетит в проперти контролноды по ссылке и мы не сможем чекнуть изменения
          */
         obj = Object.create(inner || {});
         for (let i in inner) {
            if (inner.hasOwnProperty(i)) {
               Object.defineProperty(obj, i, {
                  value: inner[i],
                  enumerable: true,
                  writable: true,
                  configurable: true
               });
            }
         }
         if (!obj[ORIGIN_FLAG]) {
            /*Делаем так чтобы объект не сериализовался при возврате с БЛ
            * при сериализации по нему делают for in*/
            Object.defineProperty(obj, ORIGIN_FLAG, {
               value: inner,
               enumerable: false,
               configurable: false
            });
         }

      } else {
         /**
          * Сюда могут передать строку
          * тогда ее отдаем как и раньше
          */
         obj = inner;
      }
      return mergeFn(obj, outer);
   };
   (reshaper as any)[UNITE_FLAG] = true;
   return reshaper;
}

export {
   ISOLATED_SCOPE_FLAG,
   ORIGIN_FLAG,
   PATCHED_FLAG_PREFIX,
   UNDEF_FLAG_PREFIX,
   controlPropMerge,
   calculateScope,
   isolateScope,
   createScope,
   presetScope,
   uniteScope
}
