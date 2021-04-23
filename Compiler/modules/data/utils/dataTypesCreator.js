define('Compiler/modules/data/utils/dataTypesCreator', [
   'Compiler/modules/data/utils/functionStringCreator',
   'Compiler/codegen/TClosure'
], function(FSC, TClosure) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var interpretedDataTypes = [
      'Array',
      'String',
      'Number',
      'Boolean',
      'Value',
   ];

   var injectedDataTypes = interpretedDataTypes.concat([
      'Object',
      'Function',
   ]);

   function createStringDataRepresentaion(str) {
      return FSC.wrapAroundExec('"' + str.replace(/' \+ \(/g, '" + (').replace(/\) \+ '/g, ') + "') + '"');
   }

   /**
    * Если только текст, то обработаем как текст
    * Если только переменная отдами чистое значение
    * @param res
    * @param children
    * @returns {*}
    */
   function createCleanDataRepresentation(res, children) {
      var cArray = [], delimited;
      if (children && children.length) {
         cArray = children[0] && children[0].data;
         if (cArray) {
            if (cArray.reduce) {
               delimited = cArray.reduce(findDelimiter, false);
            } else {
               delimited = findDelimiter(false, cArray);
            }
            if (delimited && cArray.length === 1) {
               return createValueDataRepresentation(res);
            }
         }
      }
      return createStringDataRepresentaion(res);
   }

   /**
    * Отдадим чистое значение
    * @param str
    * @returns {*}
    */
   function createArrayDataRepresentation(str, isWasabyTemplate) {
      return FSC.wrapAroundExec(
         TClosure.genCreateDataArray(
            FSC.prepareStringForExec(JSON.stringify(str)),
            isWasabyTemplate
         )
      );
   }

   /**
    * Отдадим чистое значение
    * @param str
    * @returns {*}
    */
   function createValueDataRepresentation(str) {
      return FSC.wrapAroundExec(str.replace(/^' \+ \(/, '').replace(/\) \+ '$/, ''))
   }

   function doReplace(string) {
      return string
         .replace(/^' \+ \(/, '')
         .replace(/\) \+ '$/, '');
   }

   /**
    * Для обработки типа Number
    * @param str
    * @param children
    * @returns {*}
    */
   function createNumberDataRepresentation(str, children) {
      var cData = children && children[0] && children[0].data;
      if (cData && checkForNull(cData)) {
         return createValueDataRepresentation(str);
      }
      return FSC.wrapAroundExec(FSC.injectFunctionCall('Number', [doReplace(str)]));
   }

   /**
    * Создаем простую обработку по типу
    * @param dataType
    * @param str
    * @returns {*}
    */
   function createTypeDataRepresentation(dataType, str) {
      return FSC.wrapAroundExec(FSC.injectFunctionCall(dataType, [doReplace(str)]));
   }

   function guardFunctionFromEscaping(string) {
      var result = string;
      if (string.innerFunction) {
         result = FSC.removeObjectYen(string);
      }
      return doReplace(result);
   }

   /**
    * Понимаем, что есть одна переменная и в ней null
    * @param data
    * @returns {*|boolean}
    */
   function checkForNull(data) {
      return data && data.length === 1 && data[0] && data[0].value === FSC.wrapAroundExec('(null)');
   }

   function findDelimiter(prev, next) {
      return prev === false ? next.type === 'var' : true;
   }

   function createDataRepresentation(dataType, res, children) {
      if (interpretedDataTypes.indexOf(dataType) > -1) {
         if (dataType === 'String') {
            if (res.trim() !== '') {
               return createStringDataRepresentaion(res);
            }
         }
         if (dataType === 'Value') {
            return createCleanDataRepresentation(res, children);
         }
         if (dataType === 'Number') {
            return createNumberDataRepresentation(res, children);
         }
         if (dataType === 'Array') {
            return createArrayDataRepresentation(res, this.isWasabyTemplate);
         }
         return createTypeDataRepresentation(dataType, res);
      }
      return FSC.wrapAroundExec(guardFunctionFromEscaping(res));
   }

   /**
    * Для создания объекта, возвращаемого функцией шаблонизатора
    * @param html
    * @param data
    * @returns {{html: *, data: *}}
    */
   function createHtmlDataObject(html, data) {
      return {
         html: html,
         data: data
      };
   }

   return {
      createDataRepresentation: createDataRepresentation,
      createHtmlDataObject: createHtmlDataObject,
      injectedDataTypes: injectedDataTypes
   };
});
