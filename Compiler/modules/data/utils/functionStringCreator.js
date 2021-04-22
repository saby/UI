define('Compiler/modules/data/utils/functionStringCreator', [
   'Compiler/codegen/TClosure'
], function(TClosure) {
   'use strict';

   /**
    * Кодогенерация с помощью еинов.
    *
    * @author Крылов М.А.
    *
    * @todo перейти на кодогенерацию обходом по дереву.
    */

   var EXECUTABLE_SYMBOL = '¥';
   var OBJECT_SYMBOL = '₪';
   var ENTITY_SYMBOL = '۩';
   var DOUBLE_QUOTE_SYMBOL = '"';
   var SINGLE_QUOTE_SYMBOL = "'";

   var rawEscapingYens = [{
      toFind: /¥/g,
      toReplace: '\\u00A5'
   }, {
      toFind: /۩/g,
      toReplace: '\\u06E9'
   }, {
      toFind: /₪/g,
      toReplace: '\\u20AA'
   }];

   function wrapAround(string, stick) {
      return stick + string + stick;
   }

   function wrapAroundBrackets(string) {
      return '(' + string + ')';
   }

   function wrapAroundExecutable(string, brackets) {
      var result = string;
      if (brackets) {
         result = wrapAroundBrackets(result);
      }
      return wrapAround(result, EXECUTABLE_SYMBOL);
   }

   function wrapAroundObject(string) {
      return wrapAround(string, OBJECT_SYMBOL);
   }

   function isEntity(string) {
      return string && string.indexOf(ENTITY_SYMBOL) === 0;
   }

   function wrapAroundEntity(string) {
      if (isEntity(string)) {
         return string;
      }
      return wrapAround(string, ENTITY_SYMBOL);
   }

   function wrapAroundQuotes(string) {
      return wrapAround(string, DOUBLE_QUOTE_SYMBOL);
   }

   function chargeString(string) {
      if (string.innerFunction) {
         return string.replace(/₪/gi, '');
      }
      return string;
   }

   function execProcessString(str) {
      return SINGLE_QUOTE_SYMBOL + str.replace(/\n/g, ' ') + SINGLE_QUOTE_SYMBOL;
   }

   function injectFunctionCall(functionString, functionArgs) {
      return functionString + wrapAroundBrackets(functionArgs.join());
   }

   function prepareStringForExec(string) {
      return unescape(string).replace(/"¥¥([^¥]*?)¥¥"/g, function(str, p) {
         return p.replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
      }).replace(/"¥([^¥]*?)¥"/g, function(str, p) {
         return p.replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
      }).replace(/¥(.*?)¥/g, function(str, p) {
         return '" + ' + p.replace(/\\"/g, "\"").replace(/\\\\/g, "\\") + ' + "';
      }).replace(/"۩(.*?)۩"/g, function(str, p) {
         return p.replace(/\\"/g, "\"").replace(/\\"/g, "\\'");
      }).replace(/"₪(.*?)₪"/g, function(str, p) {
         return p.replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
      }).replace(/₪(.*?)₪/g, function(str, p) {
         return p.replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
      });
   }

   // eslint-disable-next-line consistent-return
   function escapeFromString(obj, ignoreVar) {
      if (typeof obj === 'string') {
         return chargeString(obj);
      }
      if (Array.isArray(obj)) {
         obj.forEach(function(value, index) {
            obj[index] = escapeFromString(value, ignoreVar) || obj[index];
         });
      } else if (typeof obj === 'object') {
         for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
               if (typeof obj[key] === 'string') {
                  if (key.indexOf('__dirty') > -1) {
                     if (obj[key].indexOf('["' + ignoreVar + '"') > -1) {
                        obj[key] = undefined;
                     }
                  } else {
                     obj[key] = escapeFromString(obj[key], ignoreVar);
                  }
               }
               if (typeof obj[key] === 'object') {
                  escapeFromString(obj[key], ignoreVar);
               }
            }
         }
      }
   }

   function getStr(obj, ignoreVar) {
      escapeFromString(obj, ignoreVar);
      if (typeof obj === 'string') {
         return prepareStringForExec(obj);
      }
      return prepareStringForExec(JSON.stringify(obj));
   }

   function functionTypeHandler(processData, cleanData, attrs, parseAttributes) {
      var processed = parseAttributes.call(this, {
         attribs: attrs,
         isControl: false,
         configObject: { }
      });
      try {
         var processedStr = getStr(processed).replace(/\\("|')/g, '$1').replace(/' \+ /g, '" + ').replace(/ \+ '/g, ' + "');
         var res = TClosure.genGetTypeFunc(
            execProcessString(processData(cleanData[0].data, null, undefined, true)),
            processedStr
         );
         return wrapAroundExecutable(res);
      } catch (error) {
         throw new Error('Не удалось обработать узел типа функции: ' + error.message + '. Получен узел с именем ' + cleanData[0].name);
      }
   }

   function escapeRawYens(string) {
      // converting of special symbols. it needs for template building
      // without errors in regexp what uses this symbols.
      var result = string;
      rawEscapingYens.forEach(function(re) {
         result = result.replace(re.toFind, re.toReplace);
      });
      return result;
   }

   function insertIntoExecutable(executable, addition) {
      return executable.replace('¥', '¥' + addition);
   }

   function removeObjectYen(string) {
      return string.replace(/₪/gi, '');
   }

   return {
      getStr: getStr,
      prepareStringForExec: prepareStringForExec,
      wrapAroundObject: wrapAroundObject,
      wrapAroundEntity: wrapAroundEntity,
      wrapAroundQuotes: wrapAroundQuotes,
      wrapAroundExec: wrapAroundExecutable,
      injectFunctionCall: injectFunctionCall,
      execProcessString: execProcessString,
      functionTypeHandler: functionTypeHandler,
      escapeRawYens: escapeRawYens,
      insertIntoExec: insertIntoExecutable,
      removeObjectYen: removeObjectYen
   };
});
