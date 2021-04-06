/// <amd-module name="UICore/_vdom/Utils/Functional" />
/* tslint:disable */

/**
 * Преобразуем аргументы вызова функции к честному массиву
 * @param argumentsObj
 * @returns {Array}
 */
export function argumentsToArray(argumentsObj) {
   var
      ln = argumentsObj.length,
      args = new Array(ln),
      i;

   if (typeof ln !== 'number') {
      throw new Error('argumentsToArray - wrong arg');
   }

   for (i = 0; i !== ln; i++) {
      args[i] = argumentsObj[i];
   }
   return args;
}

/**
 * Собирает результаты вызовов прокидывая их в вызов следующей фукнкции
 * @param {Function|Function[]} fn - функция или массив функций
 * @returns {Function}
 */
export function composeWithResultApply(fn) {
   var
      functions = Array.isArray(fn) ? fn : argumentsToArray(arguments),
      funcsLn = functions.length;

   return function () {
      var
         res = functions[funcsLn - 1].apply(this, arguments),
         i;

      for (i = funcsLn - 2; i >= 0; i--) {
         res = res instanceof Array ? functions[i].apply(this, res) : functions[i].call(this, res);
      }

      return res;
   };
}

/**
 * Осуществляет поиск функции через проход по прототипам вверх
 * Вызывает callback для этих методов начиная с базового класса
 * @param classFn - класс
 * @param funcName - имя функции
 * @param reduceFn - callback
 * @param memo
 * @returns {*}
 */
export function reduceHierarchyFunctions(classFn, funcName, reduceFn, memo) {
   var
      proto = classFn.prototype,
      result = memo,
      funcs = [],
      i,
      func;

   while (proto && proto.constructor) {
      if (proto.hasOwnProperty(funcName) && typeof proto[funcName] === 'function') {
         func = proto[funcName];
         if (func) {
            funcs.push(func);
         }
      }
      proto = proto.constructor.superclass;
   }

   for (i = funcs.length - 1; i !== -1; i--) {
      result = reduceFn(result, funcs[i]);
   }

   return result;
}

/**
 * Возвращает функцию вызывающую последовательно все методы от предка до текщуего класса
 * @param classFn - класс
 * @param funcName - имя функции
 * @returns {Function}
 */
export function composeHierarchyFunctions(classFn, funcName) {
   var funcs = getHierarchyFunctions(classFn, funcName);

   return composeWithResultApply(funcs);
}

/**
 * Возвращает список всех функций по иерархии
 * @param classFn - класс
 * @param funcName - имя метода
 * @returns {*}
 */
export function getHierarchyFunctions(classFn, funcName) {
   var
      funcs = reduceHierarchyFunctions(
         classFn,
         funcName,
         function (result, fn) {
            result.unshift(fn);
            return result;
         },
         []
      );

   return funcs;
}

export function assert(cond, msg?) {
   var message;
   if (!cond) {
      message = typeof msg == 'function' ? msg() : msg;
      throw new Error(message || 'assert');
   }
}
