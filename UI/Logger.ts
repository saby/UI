/// <amd-module name="UI/Logger" />

// @ts-ignore
import { IoC } from 'Env/Env';

// TODO нужно обсудить задачу на перенос goUpByControlTree к общим функции UI
// @ts-ignore
import { goUpByControlTree } from 'UI/Focus';

/** 
 * Каждый раз при обращении к логеру - нужно получить актуальный инстанс
 * Если этого не делать, то все потребители кто мокнул (тесты\прикладные точки) - теряют возможность сделать bind
 */
const logger = () => IoC.resolve('ILogger');

/**
   Модуль логирования, восстанавливает стек и формирует сообщения в едином формате.
   Пример обработки:
   CONTROL ERROR: Event handle "click" in "Controls-demo/ErrorsEmulator/ErrorsDemo"

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
 * Подготавливает стек относительно точки возникновения ошибки. Работает как с DOM, так и с Control
 * Пример:
 *    ↱ Controls-demo/ErrorsEmulator/ErrorsDemo
 *     ↱ Controls/Container/Async
 *      ↱ Controls-demo/RootRouter
 *       ↱ Controls-demo/Index
 *        ↱ UI/Base:Document
 *
 * @param data - Control \ WCN \ DOM элемент
 * @private
 * @return {String}

 */
const prepareStack = (data: any): string => {
   let message = '';
   let countIndent = 1;
   const arrow = ' \u21B1 ';

   // если передали DOM - конвертируем в контрол
   if (data.getAttribute) {
      var nodes = data.controlNodes;

      // controls на переданной ноде может не быть
      if (nodes) {
         data = nodes[nodes.length-1]; // последний контрол, есть основной
      }
   }

   // если передали WCN - конвертируем в контрол
   if (data.control) {
      data = data.control; 
   }

   // список модулей для отфильтровывания стека 
   const excludeControls = {
      'Controls/event:Register': true,
      'Router/router:Route': true,
      'UI/_base/HTML/Wait': true
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
   
   /**
    * Формируем строку лесенкой со стеком
    * @param {Controls} control 
    */
   const _createStack = (control): void => {
      let moduleName = control._moduleName;
      if (moduleName && !excludeControls[moduleName]) {
         message += '\n' + _repeat(countIndent, ' ') + arrow + moduleName;
         countIndent += 1;
      }
   }

   if (window && data && data._container) {
      // на клиенте используем функционал из модуля Focus
      let array_control = goUpByControlTree(data._container);
      array_control.map(_createStack);
   } else {
      // на сервере просто поднимаемся вверх по родителям
      do {
         if (data) {
            _createStack(data);
         }

         if (data._logicParent) {
            // Wasaby
            data = data._logicParent
         } else if (data.getParent) {
            // WS3
            data = data.getParent()
         } else {
            // конец, родителей больше нет
            data = null
         }
      } while (data);
   }

   return message;
}

/**
 * Получает имя текущей функции по стеку ошибки, для граничных случаев
 * https://stackoverflow.com/questions/1013239/can-i-get-the-name-of-the-currently-running-function-in-javascript
 * @param {Any} data 
 * @private
 * @return {String}
 */
const getCurrentFunctionInfo = (data?: any): string  => {
   let currentFunc = '';
   if (!data) {
      data = createFakeError('error');
   }

   try {
      currentFunc = data.stack.match(/at (\S+)/g)[0].slice(3);
   } catch (e) {
      // Страховка, если вдруг возникла ошибка определения точки входа 
      currentFunc = '[not detected]';
   }
   return currentFunc;
}

/**
 * Создание объекта ошибки для генерации стека и точки входа
 * @param {String} msg - сообщение в стек ошибки
 * @private
 * @return {Error}
 */
const createFakeError = (msg: string=''): any => {
   let errorObject = {};
   try {
      throw new Error(msg);
   } catch(e) {
      errorObject = e;
   }
   return errorObject
}

/**
 * Обработка сообщений
 * @param {String} msg - произвольное текстовое сообщение
 * @return {Object}
 */
const log = (msg: string=''): object => {
   let data = `CONTROL INFO: ${msg}`;
   logger().log(data);
   return {msg, data} ;
};

/**
 * Обработка предупреждений
 * @param {String} msg 
 * @return {Object}
 */
const warn = (msg: string=''): object => {
   let data = `CONTROL WARN: ${msg}`;
   logger().warn(data);
   return {msg, data};
}

/**
 * Обработка ошибки
 * @param {String} msg - текстовое сообщение об ошибки, расширяется в зависимости от errorPoint 
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть Control, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 */
const error = (msg: string='', errorPoint: any, errorInfo: any): object => {
   let data;
   // если нет информации по ошибке, создадим сами
   if (!errorInfo) {
      errorInfo = createFakeError(msg);
   }

   // если есть точка входа - подготовим стек
   if (msg) {
      
      if (!msg.includes('LIFECYCLE')){
         data = msg;
      }
         
      if (errorPoint) {
         // если мы можем определить контрол источник, добавим в вывод
         if (errorPoint._moduleName) {
            data += ` IN "${errorPoint._moduleName}"`;
         }

         // определение стека вызова по источнику ошибки
         data += '\n' + prepareStack(errorPoint) + '\n';
      }
   } else {
      // если есть точка входа, но нет сообщения - создадим по точке входа (берется последняя функция)
      data = ' IN ' + getCurrentFunctionInfo(errorInfo)
   }

   logger().error('CONTROL ERROR', data, errorInfo);
   data = 'CONTROL ERROR:' + data;
   return {msg, data, errorInfo};
};

/**
 * Обработка ошибок хуков жизненного цикла
 * @param {String} hookName 
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть Control, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 */
const lifeError = (hookName: string='[not detected]', errorPoint: any, errorInfo: any): object => {
   let moduleName = errorPoint ? errorPoint._moduleName : getCurrentFunctionInfo();
   return error('LIFECYCLE ERROR: IN ' + moduleName + '. HOOK NAME: ' + hookName, errorPoint, errorInfo);
};

/**
 * Обработка ошибок шаблона
 * @param {String} hookName 
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть Control, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 */
const templateError = (hookName: string='[not detected]', errorPoint: any, errorInfo: any): object => {
   let moduleName = errorPoint ? errorPoint._moduleName : getCurrentFunctionInfo();
   return error('TEMPLATE ERROR: IN ' + moduleName + '. HOOK NAME: ' + hookName, errorPoint, errorInfo);
};

export {
   log,
   error,
   warn,
   lifeError,
   templateError
};
