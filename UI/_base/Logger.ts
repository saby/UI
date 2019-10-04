// @ts-ignore
import { IoC } from 'Env/Env';

const logger = IoC.resolve('ILogger');

/**
   Пример ошибки с обработкой:
   CONTROL ERROR => Event handle: "click" in "Controls-demo/ErrorsEmulator/ErrorsDemo"

   ↱ Controls-demo/ErrorsEmulator/ErrorsDemo
      ↱ Controls/Container/Async
      ↱ Controls-demo/RootRouter
      ↱ Controls-demo/Index
         ↱ UI/Base:Document

   Error: Ошибка по клику внутри обработчика (прикладной текст).
      at overrides.constructor._notFoundHandler (ErrorsDemo.js:47)
      at overrides.constructor.f (eval at req.exec (require-min.js:1), <anonymous>:12:2279)
      at vdomEventBubbling (DOMEnvironment.js:744)
      at constructor.captureEventHandler (DOMEnvironment.js:911)
      at constructor.handleClick [as _handleClick] (DOMEnvironment.js:479)
      at constructor.<anonymous> (DOMEnvironment.js:968)
 */


/**
 * Подготавливает стек относительно точки возникновения ошибки
 * Пример:
 *    ↱ Controls-demo/ErrorsEmulator/ErrorsDemo
 *     ↱ Controls/Container/Async
 *      ↱ Controls-demo/RootRouter
 *       ↱ Controls-demo/Index
 *        ↱ UI/Base:Document
 *
 * @param data - Control \ WCN \ DOM элемент
 */
function prepareStack(data: any): string {
   let message = '';
   let countIndent = 1;
   let arrow = ' \u21B1 ';

   // если передали DOM - конвертируем в WCN
   if (data.getAttribute) {
      data = data.controlNodes[0];
   }

   let isControl = Boolean(data._options)

   const excludeControls = {
      'Controls/event:Register': true,
      // TODO нужно подумать на тему иных модулей для отфильтровывания стека 
   };

   /**
   * Функция генерация отступов для стека
   * IE не поддерживает String.repeat
   * TODO задать вопрос о переносе к полифилам
   * https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
   */
   const _repeat = (count: number, str: string): string => {
      var rpt = '';
      for (var i = 0; i < count; i++) {
         rpt += str;
      }
      return rpt;
   }

   let unit = data;
   do {
      if (unit) {
         let moduleName = unit._moduleName;
         if (moduleName && !excludeControls[moduleName]) {
            message += '\n' + _repeat(countIndent, ' ') + arrow + moduleName;
            countIndent += 1;
         }
      }

      // для контролов и DOM узлов разные способы подъема вверх по дереву
      unit = isControl ? unit._logicParent : unit.parent;
   } while (unit);

   return message;
}

/**
 * Обработка сообщений
 * @param {String} msg - произвольное текстовое сообщение
 */
function log(msg: string): object {
   logger.log(`CONTROL INFO => ${msg}`);
   return {msg};
};

/**
 * Обработка ошибки
 * @param {String} msg - текстовое сообщение об ошибки, расширяется в зависимости от errorPoint 
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть контролом, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 */
function error(msg: string, errorPoint: any, errorInfo: any): object {

   // если нет информации по ошибке, создадим сами
   if (!errorInfo) {
      errorInfo = new Error('CONTROL ERROR => ');
   }

   if (errorPoint) {
      // если есть точка входа - подготовим стек
      if (msg) {
         msg = 'CONTROL ERROR => ' + msg;

         // если мы можем определить контрол источник, добавим в вывод
         if (errorPoint._moduleName) {
            msg += ` in "${errorPoint._moduleName}"`;
         }

         // определение стека вызова по источнику ошибки
         msg += '\n' + prepareStack(errorPoint) + '\n';
      } else {
         // если есть точка входа, но нет сообщения - создадим по точке входа (берется последняя функция)
         msg = 'CONTROL ERROR => IN ' + errorInfo.stack.match(/at (\S+)/g)[0].slice(3);
      }
   }

   logger.error(msg, errorInfo);
   return {msg, errorInfo};
};

/**
 * Обработка хуков жизненного цикла
 * @param {String} hookName 
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть контролом, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 */
function lifeError(hookName: string, errorPoint: any, errorInfo: any): object {
   return error('LIFECYCLE ERROR => IN ' + errorPoint._moduleName + '. HOOK NAME: ' + hookName, errorPoint, errorInfo);
};

/**
 * Обработка ошибок шаблона
 * @param {String} hookName 
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть контролом, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 */
function templateError(hookName: string, errorPoint: any, errorInfo: any): object {
   return error('TEMPLATE ERROR => IN ' + errorPoint._moduleName + '. HOOK NAME: ' + hookName, errorPoint, errorInfo);
};

export {
   log,
   error,
   lifeError,
   templateError
};
