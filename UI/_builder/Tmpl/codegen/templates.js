define('UI/_builder/Tmpl/codegen/templates', [
   'UI/_builder/Tmpl/codegen/jstpl'
], function(jstpl) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var EMPTY_STRING = '';
   var newlineRegExp = /\r|\n/g;

   /**
    * Предобработать текст шаблона.
    * @param text Текст шаблона.
    * @returns {string} Предобработанный текст шаблона.
    */
   function preprocessRawTemplate(text) {
      return text
         .replace(newlineRegExp, EMPTY_STRING);
   }

   // Если второй аргумент функции replace - строка, то там могут быть специальные шаблоны замены.
   // Если в шаблон-функцию попадёт один из них, финальный вариант после всех replace можеть сломать вызов new Function.
   // И будет очень сложно понять, почему. Во избежание этого, вторым аргументом replace будем передавать функцию.
   // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
   // $$	Вставляет символ доллара «$».
   // $& - Вставляет сопоставившуюся подстроку.
   // $` - Вставляет часть строки, предшествующую сопоставившейся подстроке.
   // $' - Вставляет часть строки, следующую за сопоставившейся подстрокой.
   // $n или $nn - Символы n или nn являются десятичными цифрами, вставляет n-ную сопоставившуются подгруппу
   // из объекта RegExp в первом параметре.
   function generateReturnValueFunction(value) {
      return function() {
         return value;
      };
   }

   // Предобработанные шаблоны
   var defineTemplate = preprocessRawTemplate(jstpl.DEFINE);
   var forTemplate = preprocessRawTemplate(jstpl.FOR);
   var foreachTemplate = preprocessRawTemplate(jstpl.FOREACH);
   var headTemplate = preprocessRawTemplate(jstpl.HEAD);
   var bodyTemplate = preprocessRawTemplate(jstpl.BODY);
   var stringTemplate = preprocessRawTemplate(jstpl.STRING_TEMPLATE);
   var functionTemplate = preprocessRawTemplate(jstpl.FUNCTION_TEMPLATE);
   var objectTemplate = preprocessRawTemplate(jstpl.OBJECT_TEMPLATE);
   var includedTemplate = preprocessRawTemplate(jstpl.INCLUDED_TEMPLATE);
   var privateTemplate = preprocessRawTemplate(jstpl.PRIVATE_TEMPLATE);
   var privateTemplateHeader = preprocessRawTemplate(jstpl.PRIVATE_TEMPLATE_HEADER);
   var partialTemplate = preprocessRawTemplate(jstpl.PARTIAL_TEMPLATE);

   /**
    * Очистить сгенерированный текст шаблона от deprecated-блоков.
    * @param text Сгенерированный текст шаблона.
    * @returns {string} Очищенный текст шаблона.
    */
   function clearSourceFromDeprecated(text) {
      var end, clearedSource = text;
      var start = clearedSource.indexOf('/*#DELETE IT START#*/');
      while (start > -1) {
         end = clearedSource.indexOf('/*#DELETE IT END#*/');
         clearedSource = clearedSource.substr(0, start) + clearedSource.substr(end + 19);
         start = clearedSource.indexOf('/*#DELETE IT START#*/');
      }
      return clearedSource;
   }

   /**
    * Сгенерировать define-модуль шаблона.
    * @param moduleName Имя модуля.
    * @param moduleExtension Расширение шаблона.
    * @param templateFunction Функция шаблона, содержащая privateFn, includedFn.
    * @param dependencies Массив зависимостей.
    * @param reactiveProperties Массив имен реактивных свойств.
    * @returns {string} Сгенерированный текст шаблона.
    */
   function generateDefine(moduleName, moduleExtension, templateFunction, dependencies, reactiveProperties) {
      var index, functionName, functionBody;
      var includedTemplates = '';
      var localDependenciesList = '';
      var privateTemplates = '';
      var template = templateFunction.toString()
         .replace('function anonymous', 'function ' + templateFunction.name);

      if (templateFunction.privateFn) {
         for (index = 0; index < templateFunction.privateFn.length; ++index) {
            functionName = templateFunction.privateFn[index].name;
            functionBody = templateFunction.privateFn[index].toString()
               .replace('function anonymous', 'function ' + functionName);
            privateTemplates += functionBody;
         }
      }

      if (templateFunction.includedFn) {
         for (functionName in templateFunction.includedFn) {
            if (templateFunction.includedFn.hasOwnProperty(functionName)) {
               includedTemplates += 'function ' + functionName + '(data, attr, context, isVdom, sets, forceCompatible, generatorConfig)' + templateFunction.includedFn[functionName];
               localDependenciesList += 'depsLocal["' + functionName + '"] = ' + functionName + ';';
            }
         }
      }

      var dependenciesList = '';
      var headDependencies = [
         'UI/Executor',
         'i18n!' + moduleName.split('/')[0]
      ];
      if (dependencies) {
         for (index = 0; index < dependencies.length; ++index) {
            dependenciesList += 'depsLocal["' + dependencies[index] + '"] = deps[' + (index + headDependencies.length) + '];';
         }
      }

      var finalDependencies = headDependencies.concat(dependencies);

      return defineTemplate
         .replace(/\/\*#TEMPLATE#\*\//g, generateReturnValueFunction(template))
         .replace(/\/\*#MODULE_EXTENSION#\*\//g, generateReturnValueFunction(moduleExtension))
         .replace(/\/\*#PRIVATE_TEMPLATES#\*\//g, generateReturnValueFunction(privateTemplates))
         .replace(/\/\*#INCLUDED_TEMPLATES#\*\//g, generateReturnValueFunction(includedTemplates))
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, 'true')
         .replace(/\/\*#MODULE_NAME#\*\//g, generateReturnValueFunction(moduleName))
         .replace(/\/\*#LOCAL_DEPENDENCIES#\*\//g, generateReturnValueFunction(dependenciesList + localDependenciesList))
         .replace(/\/\*#DEPENDENCIES#\*\//g, generateReturnValueFunction(JSON.stringify(finalDependencies)))
         .replace(/\/\*#REACTIVE_PROPERTIES#\*\//g, generateReturnValueFunction(JSON.stringify(reactiveProperties)));
   }

   function generateTmplDefine(moduleName, moduleExtension, templateFunction, dependencies, reactiveProperties) {
      var index;
      var template = templateFunction.toString()
         .replace('function anonymous', 'function ' + templateFunction.name);
      var dependenciesList = '';
      var headDependencies = [
         'UI/Executor',
         'i18n!' + moduleName.split('/')[0]
      ];
      if (dependencies) {
         for (index = 0; index < dependencies.length; ++index) {
            dependenciesList += '_deps["' + dependencies[index] + '"] = deps[' + (index + headDependencies.length) + '];';
         }
      }

      var finalDependencies = headDependencies.concat(dependencies);
      return defineTemplate
         .replace(/\/\*#TEMPLATE#\*\//g, generateReturnValueFunction(template))
         .replace(/\/\*#MODULE_EXTENSION#\*\//g, generateReturnValueFunction(moduleExtension))
         .replace(/\/\*#PRIVATE_TEMPLATES#\*\//g, EMPTY_STRING)
         .replace(/\/\*#INCLUDED_TEMPLATES#\*\//g, EMPTY_STRING)
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, 'false')
         .replace(/\/\*#MODULE_NAME#\*\//g, generateReturnValueFunction(moduleName))
         .replace(/\/\*#LOCAL_DEPENDENCIES#\*\//g, generateReturnValueFunction(dependenciesList))
         .replace(/\/\*#DEPENDENCIES#\*\//g, generateReturnValueFunction(JSON.stringify(finalDependencies)))
         .replace(/\/\*#REACTIVE_PROPERTIES#\*\//g, generateReturnValueFunction(JSON.stringify(reactiveProperties)));
   }

   /**
    * Сгенерировать блок кода для инструкции for (init; test; update).
    * @param init Выражение инициализации.
    * @param test Выражение условия.
    * @param update Выражение обновления.
    * @param processedBlock Тело цикла.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateFor(init, test, update, processedBlock) {
      return forTemplate
         .replace(/\/\*#INIT#\*\//g, generateReturnValueFunction(init))
         .replace(/\/\*#TEST#\*\//g, generateReturnValueFunction(test))
         .replace(/\/\*#UPDATE#\*\//g, generateReturnValueFunction(update))
         .replace(/\/\*#PROCESSED#\*\//g, generateReturnValueFunction(processedBlock));
   }

   /**
    * Сгенерировать блок кода для инструкции for (key, value in collection).
    * @param scopeArray Выражение итерируемой коллекции.
    * @param forSource Инструкции цикла (key и value).
    * @param processedBlock Тело цикла.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateForeach(scopeArray, forSource, processedBlock) {
      var iteratorScope = JSON.stringify({
         key: forSource.key,
         value: forSource.value
      });
      return foreachTemplate
         .replace(/\/\*#SCOPE_ARRAY#\*\//g, generateReturnValueFunction(scopeArray))
         .replace(/\/\*#ITERATOR_SCOPE#\*\//g, generateReturnValueFunction(iteratorScope))
         .replace(/\/\*#PROCESSED#\*\//g, generateReturnValueFunction(processedBlock));
   }

   /**
    * Сгенерировать заголовок функции шаблона - блок инициализации переменных.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateTemplateHead() {
      return headTemplate;
   }

   /**
    * Сгенерировать тело функции шаблона - блок формирования верстки.
    * @param fileName Путь к файлу шаблона.
    * @param markupGeneration Блок генерации верстки.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateTemplateBody(fileName, markupGeneration) {
      return bodyTemplate
         .replace(/\/\*#FILE_NAME#\*\//g, fileName)
         .replace(/\/\*#MARKUP_GENERATION#\*\//g, generateReturnValueFunction(markupGeneration));
   }

   /**
    * Сгенерировать контентный шаблон.
    * FIXME: Уточнить этот вид шаблона.
    * @param propertyName Имя свойства контентного шаблона.
    * @param templateBody Тело шаблона.
    * @param fileName Путь к файлу шаблона.
    * @param isString Метка: генерировать шаблон для строки или функции.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateTemplate(propertyName, templateBody, fileName, isString) {
      var tmpl = isString ? stringTemplate : functionTemplate;
      return tmpl
         .replace(/\/\*#PROPERTY_NAME#\*\//g, generateReturnValueFunction(propertyName))
         .replace(/\/\*#TEMPLATE_BODY#\*\//g, generateReturnValueFunction(templateBody));
   }

   /**
    * Сгенерировать non-included наблон.
    * FIXME: Уточнить этот вид шаблона.
    * @param template Шаблон.
    * @param internal Набор internal выражений.
    * @param postfix Строка, которую необходимо добавить в конце сгенерированного блока.
    * @param isWasabyTemplate Флаг wml шаблона.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateObjectTemplate(template, internal, postfix, isWasabyTemplate) {
      var postfixCall = postfix || '';
      return objectTemplate
         .replace('/*#TEMPLATE#*/', generateReturnValueFunction(template))
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, isWasabyTemplate)
         .replace('/*#INTERNAL#*/', generateReturnValueFunction(internal)) + postfixCall;
   }


   /**
    * Сгенерировать included наблон.
    * FIXME: Уточнить этот вид шаблона.
    * @param template Шаблон.
    * @param internal Набор internal выражений.
    * @param postfix Строка, которую необходимо добавить в конце сгенерированного блока.
    * @param isWasabyTemplate Флаг wml шаблона.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateIncludedTemplate(template, internal, postfix, isWasabyTemplate) {
      var postfixCall = postfix || '';
      return includedTemplate
         .replace('/*#TEMPLATE#*/', generateReturnValueFunction(template))
         .replace('/*#TEMPLATE_JSON#*/', generateReturnValueFunction(template))
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, isWasabyTemplate)
         .replace('/*#INTERNAL#*/', generateReturnValueFunction(internal)) + postfixCall;
   }

   function generatePrivateTemplate(body) {
      return privateTemplate
         .replace('/*#BODY#*/', generateReturnValueFunction(body));
   }

   function generatePrivateTemplateHeader(name, body) {
      return privateTemplateHeader
         .replace('/*#NAME#*/', generateReturnValueFunction(name))
         .replace('/*#BODY#*/', generateReturnValueFunction(body));
   }

   function generatePartialTemplate(body) {
      return partialTemplate
         .replace('/*#BODY#*/', generateReturnValueFunction(body));
   }

   return {
      clearSourceFromDeprecated: clearSourceFromDeprecated,
      generateDefine: generateDefine,
      generateTmplDefine: generateTmplDefine,
      generateFor: generateFor,
      generateForeach: generateForeach,
      generateTemplateHead: generateTemplateHead,
      generateTemplateBody: generateTemplateBody,
      generateTemplate: generateTemplate,
      generateObjectTemplate: generateObjectTemplate,
      generateIncludedTemplate: generateIncludedTemplate,
      generatePrivateTemplate: generatePrivateTemplate,
      generatePrivateTemplateHeader: generatePrivateTemplateHeader,
      generatePartialTemplate: generatePartialTemplate
   };
});
