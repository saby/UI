define('UI/_builder/Tmpl/codegen/templates', [
   'UI/_builder/Tmpl/codegen/jstpl'
], function(jstpl) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var EMPTY_STRING = '';

   /**
    * Предобработать текст шаблона.
    * @param text Текст шаблона.
    * @returns {string} Предобработанный текст шаблона.
    */
   function preprocessRawTemplate(text) {
      return text
         .replace(/\r|\n/g, EMPTY_STRING);
   }

   // Предобработанные шаблоны
   var defineTemplate = preprocessRawTemplate(jstpl.DEFINE);
   var forTemplate = preprocessRawTemplate(jstpl.FOR);
   var foreachTemplate = preprocessRawTemplate(jstpl.FOREACH);
   var headTemplate = preprocessRawTemplate(jstpl.HEAD);
   var bodyTemplate = preprocessRawTemplate(jstpl.BODY);
   var localizationTemplate = preprocessRawTemplate(jstpl.LOCALIZATION);
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
         .replace(/\/\*#TEMPLATE#\*\//g, template)
         .replace(/\/\*#MODULE_EXTENSION#\*\//g, moduleExtension)
         .replace(/\/\*#PRIVATE_TEMPLATES#\*\//g, privateTemplates)
         .replace(/\/\*#INCLUDED_TEMPLATES#\*\//g, includedTemplates)
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, 'true')
         .replace(/\/\*#MODULE_NAME#\*\//g, moduleName)
         .replace(/\/\*#LOCAL_DEPENDENCIES#\*\//g, dependenciesList + localDependenciesList)
         .replace(/\/\*#DEPENDENCIES#\*\//g, JSON.stringify(finalDependencies))
         .replace(/\/\*#REACTIVE_PROPERTIES#\*\//g, JSON.stringify(reactiveProperties));
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
         .replace(/\/\*#TEMPLATE#\*\//g, template)
         .replace(/\/\*#MODULE_EXTENSION#\*\//g, moduleExtension)
         .replace(/\/\*#PRIVATE_TEMPLATES#\*\//g, EMPTY_STRING)
         .replace(/\/\*#INCLUDED_TEMPLATES#\*\//g, EMPTY_STRING)
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, 'false')
         .replace(/\/\*#MODULE_NAME#\*\//g, moduleName)
         .replace(/\/\*#LOCAL_DEPENDENCIES#\*\//g, dependenciesList)
         .replace(/\/\*#DEPENDENCIES#\*\//g, JSON.stringify(finalDependencies))
         .replace(/\/\*#REACTIVE_PROPERTIES#\*\//g, JSON.stringify(reactiveProperties));
   }

   /**
    * Сгенерировать блок кода для инструкции for (init; test; update).
    * @param init Выражение инициализации.
    * @param test Выражение условия.
    * @param update Выражение обновления.
    * @param processedBlock Тело цикла.
    * @param processedExpressions Блок вычисления выражений.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateFor(init, test, update, processedBlock, processedExpressions) {
      return forTemplate
         .replace(/\/\*#INIT#\*\//g, init)
         .replace(/\/\*#TEST#\*\//g, test)
         .replace(/\/\*#UPDATE#\*\//g, update)
         .replace(/\/\*#PROCESSED#\*\//g, processedBlock)
         .replace(/\/\*#PROCESSED_EXPRESSIONS#\*\//g, (processedExpressions || ''));
   }

   /**
    * Сгенерировать блок кода для инструкции for (key, value in collection).
    * @param scopeArray Выражение итерируемой коллекции.
    * @param forSource Инструкции цикла (key и value).
    * @param processedBlock Тело цикла.
    * @param processedExpressions Блок вычисления выражений.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateForeach(scopeArray, forSource, processedBlock, processedExpressions) {
      var iteratorScope = JSON.stringify({
         key: forSource.key,
         value: forSource.value
      });
      return foreachTemplate
         .replace(/\/\*#SCOPE_ARRAY#\*\//g, scopeArray)
         .replace(/\/\*#ITERATOR_SCOPE#\*\//g, iteratorScope)
         .replace(/\/\*#PROCESSED#\*\//g, processedBlock)
         .replace(/\/\*#PROCESSED_EXPRESSIONS#\*\//g, (processedExpressions || ''));
   }

   /**
    * Сгенерировать блок инициализации rk-функции.
    * @param fileName Путь к файлу шаблона.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateLocalization(fileName) {
      var localizationModule = fileName.split('/')[0];
      return localizationTemplate
         .replace(/\/\*#LOCALIZATION_MODULE#\*\//g, localizationModule);
   }

   /**
    * Сгенерировать заголовок функции шаблона - блок инициализации переменных.
    * @param fileName Путь к файлу шаблона.
    * @param initLocalization Метка: необходимо сгенерировать блок инициализации локализации.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateTemplateHead(fileName, initLocalization) {
      var localizationBlock = initLocalization ? generateLocalization(fileName) : EMPTY_STRING;
      return headTemplate
         .replace(/\/\*#LOCALIZATION_INIT#\*\//g, localizationBlock);
   }

   /**
    * Сгенерировать тело функции шаблона - блок формирования верстки.
    * @param fileName Путь к файлу шаблона.
    * @param markupGeneration Блок генерации верстки.
    * @param processedExpressions Блок вычисления выражений.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateTemplateBody(fileName, markupGeneration, processedExpressions) {
      return bodyTemplate
         .replace(/\/\*#FILE_NAME#\*\//g, fileName)
         .replace(/\/\*#MARKUP_GENERATION#\*\//g, markupGeneration)
         .replace(/\/\*#PROCESSED_EXPRESSIONS#\*\//g, (processedExpressions || ''));
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
      var localizationBlock = generateLocalization(fileName);
      return tmpl
         .replace(/\/\*#PROPERTY_NAME#\*\//g, propertyName)
         .replace(/\/\*#TEMPLATE_BODY#\*\//g, templateBody)
         .replace(/\/\*#LOCALIZATION_INIT#\*\//g, localizationBlock);
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
         .replace('/*#TEMPLATE#*/', template)
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, isWasabyTemplate)
         .replace('/*#INTERNAL#*/', internal) + postfixCall;
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
         .replace('/*#TEMPLATE#*/', template)
         .replace('/*#TEMPLATE_JSON#*/', template)
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, isWasabyTemplate)
         .replace('/*#INTERNAL#*/', internal) + postfixCall;
   }

   function generatePrivateTemplate(body) {
      return privateTemplate
         .replace('/*#BODY#*/', body);
   }

   function generatePrivateTemplateHeader(name, body) {
      return privateTemplateHeader
         .replace('/*#NAME#*/', name)
         .replace('/*#BODY#*/', body);
   }

   function generatePartialTemplate(body) {
      return partialTemplate
         .replace('/*#BODY#*/', body);
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
