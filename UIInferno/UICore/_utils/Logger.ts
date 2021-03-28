/// <amd-module name="UI/_utils/Logger" />

// @ts-ignore
import { IoC } from 'Env/Env';
// tslint:disable: no-any

/**
 * Модуль логирования, восстанавливает стек и формирует сообщения в едином формате:
 *
 * CONTROL ERROR: Event handle "click" in "Controls-demo/ErrorsEmulator/ErrorsDemo"
 *
 *    ↱ Controls-demo/ErrorsEmulator/ErrorsDemo
 *     ↱ Controls/Container/Async
 *      ↱ Controls-demo/RootRouter
 *       ↱ Controls-demo/Index
 *        ↱ UI/Base:Document
 *
 * Error: Ошибка по клику внутри обработчика (прикладной текст).
 *    at overrides.constructor._notFoundHandler (ErrorsDemo.js:47)
 *    at overrides.constructor.f (eval at req.exec (require-min.js:1), <anonymous>:12:2279)
 *    at vdomEventBubbling (DOMEnvironment.js:744)
 *    at constructor.captureEventHandler (DOMEnvironment.js:911)
 *    at constructor.handleClick [as _handleClick] (DOMEnvironment.js:479)
 *    at constructor.<anonymous> (DOMEnvironment.js:968)
 *
 * @class UI/_utils/Logger
 * @author Шипин А.А.
 * @public
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
const _getCurrentFunctionInfo = (data: any = _createFakeError()): string  => {
   let currentFunc = '';
   const PART_STACK = 3;

   try {
      // https://stackoverflow.com/questions/1013239/can-i-get-the-name-of-the-currently-running-function-in-javascript
      currentFunc = data.stack.match(/at (\S+)/g)[0].slice(PART_STACK);
   } catch (err) {
      // Страховка, если вдруг возникла ошибка определения точки входа
      currentFunc = '[not detected]';
      logger().error(
         'CONTROL ERROR',
         '[UI/_utils/Logger:_getCurrentFunctionInfo()] \- ошибка получения текущей функции',
         err);
   }
   return currentFunc;
};

/**
 * Создание объекта ошибки для генерации стека и точки входа (когда не передали точку возникновения ошибки)
 * @private
 * @return {Error}
 */
const _createFakeError = (): Error => {
   return new Error();
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
const prepareStack = (stackNode: {[key: string]: any}): string => {
   if (!stackNode) {
      return '';
   }

   if (typeof(stackNode) === 'string') {
      return `${stackNode}
         \u21B1 В качество точки входа была передана строка, восстановление стека невозможно.`;
   }

   let message = '';
   let countIndent = 1; // глобальна для сбора стека, _createStack()
   const ARROW_NEXT = '\u21B1';
   const ARROW = '\u2192';
   const LIMIT_LEVEL_STACK = 20;
   let data = stackNode;

   // если передали DOM - конвертируем в контрол
   if ('controlNodes' in data) {
      const nodes = data.controlNodes;

      // controls на переданной ноде может не быть
      if (nodes && nodes.length > 0) {
         data = nodes[nodes.length - 1]; // последний контрол, есть основной
      }
      if (!!data) {
         data = stackNode;
      }
   }

   // если передали WCN - конвертируем в контрол
   if ('control' in data) {
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
      if (!(control instanceof Object)) {
         return '';
      }

      let moduleName = '_moduleName' in control ? control._moduleName : null;
      let stack;
      let arrow;
      let result = msg;
      if (typeof moduleName === 'string' && !excludeControls[moduleName]) {

         // для асинхронных контейнеров важен не сам контейнер в стеке, а шаблон внутри
         // сформируем читаемую строку: Controls/Container/Async:template - "MyControl/Base"
         if (moduleName === 'Controls/Container/Async') {
            const opts = control._options;
            const asyncTemplate = opts && 'templateName' in opts || 'not detected';
            moduleName += `:template - "${asyncTemplate}"`;
         }

         // если стек очень глубокий, экономим экранное место и уже строим в строчку
         if (countIndent > LIMIT_LEVEL_STACK) {
            stack = ' ';
            arrow = ARROW;
         } else {
            stack = '\n' + _repeat(countIndent, ' ');
            arrow = ARROW_NEXT;
         }

         result += `${stack}${arrow} ${moduleName}`;
         countIndent += 1;
      }
      return result;
   };

   /**
    * Поднимаемся вверх всеми возможными способами (пока есть куда) и готовим стек
    * @private
    */
   // tslint:disable: no-parameter-reassignment
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
      const NodeCollector = requirejs('UICore/NodeCollector');
      // TODO: допущение, что библиотеке фокусов загружена до ошибок, подумать как сделать лучше
      // явно тащить нельзя, цикл - UICore/NodeCollector -> UICore/_utils/Logger -> UICore/NodeCollector

      let arrayControls = [];
      if (NodeCollector) {
         // на клиенте используем функционал из модуля NodeCollector
         arrayControls = NodeCollector.goUpByControlTree(data._container);
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
const debug = (msg: string = '', data: unknown = null): object => {
   let logMsg = '';
   if (loggerConfig.debug) {
      let prepareData = '';
      if (data) {
         try {
            prepareData = JSON.stringify(data);
         } catch (err) {
            prepareData = String(data);
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
const error = (msg: string = '', errorPoint?: object | Node | any, errorInfo?: object): object => {
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
const lifeError = (
   hookName: string = '[not detected]',
   errorPoint?: object | Node | any,
   errorInfo?: object): object => {
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
const templateError = (
   message: string = '',
   templateName: string = '[not detected]',
   errorPoint?: object | Node | unknown,
   errorInfo?: object): object => {
      return error(`TEMPLATE ERROR: ${message} IN "${templateName}"`, errorPoint, errorInfo);
};

const asyncRenderErrorLog = (errorObject: any, errorPoint?: object | Node | unknown): object => {
   const message = `Async function was rejected ${error ? `with message "${errorObject.message || errorObject}"` : ''}`;
   return error(message, errorPoint, errorObject);
}

export {
   prepareStack,
   setDebug,
   debug,
   info,
   warn,
   error,
   lifeError,
   templateError,
   asyncRenderErrorLog
};
