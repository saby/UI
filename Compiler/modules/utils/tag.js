define('Compiler/modules/utils/tag', [
   'Compiler/modules/data/utils/dataTypesCreator',
   'Compiler/Config'
], function(dataTypesCreator, BuilderConfig) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var CONTROL_NAME_DIVIDER = '.';
   var CONTROL_PATH_DIVIDER = '/';
   var CYRILLIC_PATTERN = /[\u0400-\u04FF]/;
   var SBIS3_MODULE_NAME = 'SBIS3';
   var WASABY_PREFIX = 'ws:';
   var DATA_TYPES = dataTypesCreator.injectedDataTypes;
   var EMPTY_STRING = '';

   /**
    * Узнаем существует имя тэга в числе модулей или нет?
    */
   function isEntityUsefulOrHTML(nameExists, modules) {
      // условие с template для описания опции, через синтаксис ws:template внутри тега ws:Component или ws:partial
      return nameExists && (!modules.hasOwnProperty(nameExists) || nameExists === 'template') &&
         !checkForControl(nameExists, true, true) &&
         DATA_TYPES.indexOf(nameExists) === -1;
   }

   /**
    * Обработать имя контрола или вернуть undefined или false.
    */
   function checkForControl(name, isInjectingData, bool, seekingDeps) {
      var cleanName = splitWs(name) || name;
      var tagNameIfBool = bool ? name : splitWs(name);
      var isInjectingDataIfBool = bool ? true : isInjectingData;
      var seekingDepsIfBool = bool ? false : seekingDeps;
      if (!isNamedLikeControl(cleanName)) {
         return undefined;
      }
      var result = false;
      var cleanTagName;
      if (isControlOnlyDotNotation(name)) {
         if (name && DATA_TYPES.indexOf(name) === -1) {
            result = controlNameByFirstLetter(name);
            if (isInjectingData) {
               cleanTagName = cleverReplaceDotsOnDivider(name);
               if (cleanTagName.indexOf(CONTROL_PATH_DIVIDER) !== -1) {
                  return cleanTagName;
               }
               return false;
            }
         }
         return result;
      }

      // Для понимания в зависимости от контекста разбора
      // Тег компонента это или нет
      if (tagNameIfBool && DATA_TYPES.indexOf(tagNameIfBool) === -1) {
         result = controlNameByFirstLetter(tagNameIfBool);
         if (isInjectingDataIfBool) {
            // Если в имени тега есть слеши - это значит что это контрол.
            // Функции получения контрола заточены на точки. Заменим слеши на точки
            cleanTagName = tagNameIfBool.replace(/\//g, CONTROL_NAME_DIVIDER);
            if (cleanTagName.indexOf(CONTROL_NAME_DIVIDER) !== -1) {
               var splitted = cleanTagName.split(CONTROL_NAME_DIVIDER)[0];
               var oldNames = splitted === SBIS3_MODULE_NAME && seekingDepsIfBool;
               if (!seekingDepsIfBool || oldNames) {
                  return cleanTagName;
               }
               return cleanTagName.replace(/[.]/g, CONTROL_PATH_DIVIDER);
            }
            return false;
         }
      }
      return result;
   }

   /**
    * Обрезать префикс ws, если он есть, иначе вернуть undefined.
    * @param string Строка.
    * @returns {string|undefined} Строка без префикса ws или undefined.
    */
   function splitWs(string) {
      if (string !== undefined && string.indexOf(WASABY_PREFIX) === 0) {
         return string.split(WASABY_PREFIX)[1];
      }
      return undefined;
   }

   /**
    * Проверить, что первый символ строки в верхнем регистре.
    * @param string Строка.
    * @returns {string|undefined} Строку, если первый символ строки в верхнем регистре.
    */
   function controlNameByFirstLetter(string) {
      return string.charAt(0) === string.charAt(0).toUpperCase() ? string : undefined;
   }

   /**
    * Проверить, что имя контрола состоит только из точек и не содержит префикса ws.
    * @param string Имя контрола.
    * @returns {boolean} True, если имя контрола состоит только из точек и не содержит префикса ws.
    */
   function isControlOnlyDotNotation(string) {
      return string.indexOf(CONTROL_NAME_DIVIDER) >= 0 && !splitWs(string);
   }

   /**
    * Проверить, что имя контрола корректно.
    * Правило: непустая строка, не содержащая кириллицу и начинается с символа в верхнем регистре.
    * @param string Имя контрола.
    * @returns {boolean} True, если имя контрола корректно.
    */
   function isNamedLikeControl(string) {
      return !!(string && !CYRILLIC_PATTERN.test(string) && controlNameByFirstLetter(string));
   }

   /**
    * Преобразовать имя контрола в путь для загрузки зависимости.
    * @param name Имя контрола.
    * @returns {string} Путь для загрузки зависимости с префиксом ws.
    */
   function cleverReplaceDotsOnDivider(name) {
      var prefix = getMustBeDotsPrefix(name) || EMPTY_STRING;
      var tail = name && name.replace(prefix, EMPTY_STRING).replace(/\./g, CONTROL_PATH_DIVIDER);
      return prefix + tail;
   }

   /**
    * Получить префикс из массива.
    * @param name Имя контрола, которое может содержать префикс.
    * @returns {string|undefined} Имя префикса или undefined.
    */
   function getMustBeDotsPrefix(name) {
      return BuilderConfig.Config.mustBeDots.find(function(prefix) {
         return name.indexOf(prefix) === 0 ? prefix : undefined;
      });
   }

   /**
    * Преобразовать имя контрола в путь для загрузки зависимости, добавив префикс ws.
    * @param tagName Имя контрола.
    * @returns {string} Путь для загрузки зависимости с префиксом ws.
    */
   function resolveModuleName(tagName) {
      // FIXME: разрешаем разрешенный контрол! Исправить!!!
      var name = splitWs(tagName) || tagName;
      return WASABY_PREFIX + cleverReplaceDotsOnDivider(name);
   }

   return {
      splitWs: splitWs,
      checkForControl: checkForControl,
      resolveModuleName: resolveModuleName,
      isEntityUsefulOrHTML: isEntityUsefulOrHTML
   };
});
