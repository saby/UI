/// <amd-module name="UI/_utils/Logger" />

// @ts-ignore
import { IoC } from 'Env/Env';

/**
   Модуль логирования, восстанавливает стек и формирует сообщения в едином формате:

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
 * Каждый раз при обращении к ILogger - нужно получить актуальный инстанс
 * Если этого не делать, то все потребители кто мокнул (тесты\прикладные точки) - теряют возможность сделать bind
 */
const logger = () => IoC.resolve('ILogger');

/**
 * Доступность режима отладки для сообщений
 */
const loggerConfig = { debug : false }; 

/**
 * Получает имя текущей функции по стеку ошибки, для граничных случаев
 * @param {Any} data
 * @private
 * @return {String}
 */
const _getCurrentFunctionInfo = (data?): string  => {
   let currentFunc = '';
   const PART_STACK = 3;
   if (!data) {
      data = _createFakeError();
   }

   try {
      // https://stackoverflow.com/questions/1013239/can-i-get-the-name-of-the-currently-running-function-in-javascript
      currentFunc = data.stack.match(/at (\S+)/g)[0].slice(PART_STACK);
   } catch (err) {
      // Страховка, если вдруг возникла ошибка определения точки входа
      currentFunc = '[not detected]';
      logger().error('CONTROL ERROR', '[UI/_utils/Logger:_getCurrentFunctionInfo()] - ошибка получения текущей функции', err);
   }
   return currentFunc;
};

/**
 * Создание объекта ошибки для генерации стека и точки входа (когда не передали точку возникновения ошибки)
 * @private
 * @return {Error}
 */
const _createFakeError = () => {
   let errorObject = {};
   try {
      // нужно для того чтобы не потерять стек исходной ошибки,
      // в противном случае в лог будет попадать стек из ближайшего catch
      throw new Error();
   } catch (error) {
      errorObject = error;
   }
   return errorObject;
};

/**
 * Подготавливает стек относительно точки возникновения ошибки. Работает как с DOM, так и с Control
 * Если стек слишком большой, после уровня LIMIT_LEVEL_STACK будет в одну строку
 *  Пример:
 *    ↱ Controls-demo/ErrorsEmulator/ErrorsDemo
 *     ↱ Controls/Container/Async
 *      ↱ Controls-demo/RootRouter
 *       ↱ Controls-demo/Index
 *        ↱ UI/Base:Document
 *
 * @param data - Control \ WCN (Wasaby Control Node) \ DOM элемент
 * @public
 * @return {String}
 */
const prepareStack = (data: any): string => {
   let message = '';
   let countIndent = 1; // глобальна для сбора стека, _createStack()
   const ARROW_NEXT = '\u21B1';
   const ARROW = '\u2192';
   const LIMIT_LEVEL_STACK = 20;

   // если передали DOM - конвертируем в контрол
   if (data.getAttribute) {
      const nodes = data.controlNodes;

      // controls на переданной ноде может не быть
      if (nodes) {
         data = nodes[nodes.length - 1]; // последний контрол, есть основной
      }
   }

   // если передали WCN - конвертируем в контрол
   if (data.control) {
      data = data.control;
   }

   // список модулей, которые не попадут в стек
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
      let rpt = '';
      for (let i = 0; i < count; i++) {
         rpt += str;
      }
      return rpt;
   };

   /**
    * Формируем строку лесенкой со стеком
    * Не явно мутирует message \ countIndent - оптимизация, чтобы несколько раз не бегать по стеку после получения списка предков
    * @param {Controls} control
    * @private
    */
   const _createStack = (control: any, msg: string): string => {
      const moduleName = control._moduleName;
      let stack;
      let arrow;
      if (moduleName && !excludeControls[moduleName]) {

         // если стек очень глубокий, экономим экранное место и уже строим в строчку
         if (countIndent > LIMIT_LEVEL_STACK) {
            stack = ' ';
            arrow = ARROW;
         } else {
            stack = '\n' + _repeat(countIndent, ' ');
            arrow = ARROW_NEXT;
         }

         msg += `${stack}${arrow} ${moduleName}`;
         countIndent += 1;
      }
      return msg;
   };

   /**
    * Поднимаемся вверх всеми возможными способами (пока есть куда) и готовим стек
    * @private
    */
   const _customSearchParents = (point: any, msg: string): string => {
      do {
         if (point) {
            msg = _createStack(point, msg);
         }

         if (point._logicParent) {
            // Wasaby
            point = point._logicParent;
         } else if (point.getParent) {
            // WS3
            point = point.getParent();
         } else {
            // конец, родителей больше нет
            point = null;
         }
      } while (point);

      return msg;
   };

   if (window && data && data._container) {
      // @ts-ignore
      const Focus = requirejs('UI/Focus');
      // TODO: допущение, что библиотеке фокусов загружена до ошибок, подумать как сделать лучше
      // явно тащить нельзя, цикл - UI/Focus -> UI/_utils/Logger -> UI/Focus
      
      let arrayControls = [];
      if (Focus) {
         // на клиенте используем функционал из модуля Focus
         arrayControls = Focus.goUpByControlTree(data._container);
      }

      if (arrayControls && arrayControls.length) {
         // подготовим стек по массиву родителей
         arrayControls.forEach((item) => {
            message = _createStack(item, message);
         });
      } else {
         // если поиск через систему фокусов не дал результатов, попробуем в вверх восстановить стек
         message = _customSearchParents(data, message);
      }
   } else {
      // goUpByControlTree не работает на сервере, так как нет DOM - попробуем в вверх восстановить стек
      message = _customSearchParents(data, message);
   }

   return message;
};

/** 
 * При установке режима Debug активируется дополнительное логирование определенных участков ядра 
 * @param {Boolean} value
 * @public
 * @return {Boolean}
 */
const setDebug = (value: boolean): boolean => {
   loggerConfig.debug = value;
   return loggerConfig.debug;
};

/**
 * Логирование отладочной информации
 * @param {String} msg - произвольное текстовое сообщение
 * @param {Object} data - произвольный object
 */
const debug = (msg: string = '', data: any): object => {
   let logMsg = '';
   if (loggerConfig.debug) {
      let prepareData = '';
      if (data) {
         try {
            prepareData = JSON.stringify(data);
         } catch (err) {
            prepareData = data;
         } finally {
            prepareData =`\n${prepareData}`;
         }
      }
      logMsg = `CONTROL DEBUG: ${msg} ${prepareData}`;
      logger().log(logMsg);
   }
   return {msg, logMsg} ;
};

/**
 * Обработка сообщений
 * @param {String} msg - произвольное текстовое сообщение
 * @public
 * @return {Object}
 */
const info = (msg: string = ''): object => {
   const data = `CONTROL INFO: ${msg}`;
   logger().log(data);
   return {msg, data} ;
};

/**
 * Обработка предупреждений
 * @param {String} msg
 * @public
 * @return {Object}
 */
const warn = (msg: string = '', errorPoint?): object => {
   let data = `CONTROL WARNING: ${msg}`;

   // если есть точка входа, восстановим стек
   if (errorPoint) {
      data += '\n' + prepareStack(errorPoint) + '\n';
   }

   logger().warn(data);
   return {msg, data};
};

/**
 * Обработка ошибки
 * @param {String} msg - текстовое сообщение об ошибки, расширяется в зависимости от errorPoint
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть Control, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 * @public
 * @return {Object}
 */
const error = (msg: string = '', errorPoint?, errorInfo?): object => {
   let data = '';
   let typeError = 'CONTROL ERROR';
   
   // если нет информации по ошибке, создадим сами
   if (!errorInfo) {
      errorInfo = _createFakeError();
   }

   if (msg) {
      // если ошибки хуков или другое
      if (msg.includes('LIFECYCLE') || msg.includes('TEMPLATE')) {
         typeError = msg.split(':')[0]; // возьмем тип из сообщения
         data = msg.replace(`${typeError}: `, ''); // уберем тип из сообщения, так как он пойдет 1 аргументом
         if (errorPoint) {
            data += '\n' + prepareStack(errorPoint) + '\n'; // добавим стек
         }
      } else {
         data = msg;
         if (errorPoint) {
            // если мы можем определить контрол источник, добавим в вывод
            if (errorPoint._moduleName) {
               data += ` IN "${errorPoint._moduleName}"`;
            }

            // определение стека вызова по источнику ошибки
            data += '\n' + prepareStack(errorPoint) + '\n';
         }
      }
   } else {
      // если нет сообщения - создадим по точке входа (берется последняя функция)
      data = 'IN ' + _getCurrentFunctionInfo(errorInfo);
   }

   logger().error(typeError, data, errorInfo);
   data = `${typeError}: ${data}`;
   return {msg, data, errorInfo};
};

/**
 * Обработка ошибок хуков жизненного цикла, использовать если известно имя хука
 * @param {String} hookName
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть Control, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 * @public
 */
const lifeError = (hookName: string = '[not detected]', errorPoint?, errorInfo?): object => {
   const moduleName = errorPoint ? errorPoint._moduleName : _getCurrentFunctionInfo();
   return error(`LIFECYCLE ERROR: IN "${moduleName}". HOOK NAME: "${hookName}"`, errorPoint, errorInfo);
};

/**
 * Обработка ошибок построения шаблона, использовать если известно имя шаблона
 * @param {String} message - детальное сообщение о ошибке
 * @param {String} templateName - потенциальное имя шаблона
 * @param {Object|DOM|WCN|any} errorPoint - точка возникновения ошибки, может быть Control, DOM элементом или WCN
 * @param {Object} errorInfo - нативный объект ERROR с информацией по ошибке
 * @public
 */
const templateError = (message: string = '', templateName: string = '[not detected]', errorPoint?, errorInfo?): object => {
   return error(`TEMPLATE ERROR: ${message} IN "${templateName}"`, errorPoint, errorInfo);
};

export {
   prepareStack,
   setDebug,
   debug,
   info,
   warn,
   error,
   lifeError,
   templateError
};
