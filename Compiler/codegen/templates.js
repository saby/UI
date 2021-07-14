define('Compiler/codegen/templates', [
   'Compiler/codegen/jstpl',
   'Compiler/Config',
   'Compiler/codegen/feature/Function'
], function(jstpl, builderConfig, codegenFeatureFunction) {
   'use strict';

   /**
    * @description Предоставляет методы генерации кода для конкретных узлов AST-дерева.
    * @author Крылов М.А.
    */

   /**
    * Пустая строка.
    * @type {string}
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
   var objectTemplateReact = preprocessRawTemplate(jstpl.OBJECT_TEMPLATE_REACT);
   var includedTemplateReact = preprocessRawTemplate(jstpl.INCLUDED_TEMPLATE_REACT);

   var privateTemplate = preprocessRawTemplate(jstpl.PRIVATE_TEMPLATE);
   var privateTemplateHeader = preprocessRawTemplate(jstpl.PRIVATE_TEMPLATE_HEADER);
   var partialTemplateHeader = preprocessRawTemplate(jstpl.PARTIAL_TEMPLATE_HEADER);

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

   function getPrivateFunctionName(func, index) {
      var functionName = func.name;
      if (typeof functionName === 'string' && functionName !== 'anonymous') {
         return functionName;
      }
      if (index === 0) {
         return builderConfig.Config.privateFunctionName;
      }
      return builderConfig.Config.privateFunctionName + '_' + index;
   }

   /**
    * Сгенерировать define-модуль шаблона.
    * @param moduleName Имя модуля.
    * @param moduleExtension Расширение шаблона.
    * @param templateFunction Функция шаблона, содержащая privateFn, includedFn.
    * @param dependencies Массив зависимостей.
    * @param reactiveProperties Массив имен реактивных свойств.
    * @param hasTranslations Флаг наличия в единице трансляции конструкции локализации.
    * @param useReact Флаг react сборки.
    * @returns {string} Сгенерированный текст шаблона.
    */
   function generateDefine(moduleName, moduleExtension, templateFunction, dependencies, reactiveProperties, hasTranslations, useReact) {
      var index, functionName, functionBody;
      var includedTemplates = '';
      var localDependenciesList = '';
      var privateTemplates = '';
      var mainTemplateFunctionName = templateFunction.name;
      if (mainTemplateFunctionName === 'anonymous' || mainTemplateFunctionName === undefined) {
         mainTemplateFunctionName = 'template';
      }
      var template = templateFunction.toString()
         .replace('function anonymous', 'function ' + mainTemplateFunctionName);

      if (templateFunction.internalFunctions) {
         for (index = 0; index < templateFunction.internalFunctions.length; ++index) {
            privateTemplates += templateFunction.internalFunctions[index];
         }
      }

      if (templateFunction.privateFn) {
         for (index = 0; index < templateFunction.privateFn.length; ++index) {
            functionName = getPrivateFunctionName(templateFunction.privateFn[index], index);
            functionBody = templateFunction.privateFn[index].toString()
               .replace('function anonymous', 'function ' + functionName);
            privateTemplates += functionBody;
         }
      }

      if (templateFunction.includedFn) {
         for (functionName in templateFunction.includedFn) {
            if (templateFunction.includedFn.hasOwnProperty(functionName)) {
               includedTemplates += codegenFeatureFunction.createTemplateFunctionString(
                  templateFunction.includedFn[functionName], functionName
               );
               localDependenciesList += 'depsLocal["' + functionName + '"] = ' + functionName + ';';
            }
         }
      }

      var dependenciesList = '';
      var headDependencies = [
         'UI/Executor'
      ];

      var moduleParams = ['Executor'];
      if (hasTranslations) {
         headDependencies.push('i18n!' + moduleName.split('/')[0]);
         moduleParams.push('rk');
      }
      if (useReact) {
         headDependencies.push('react');
         moduleParams.push('React');
      }
      if (dependencies) {
         for (index = 0; index < dependencies.length; ++index) {
            dependenciesList += 'depsLocal["' + dependencies[index] + '"] = deps[' + (index + headDependencies.length) + '];';
         }
      }

      var finalDependencies = headDependencies.concat(dependencies);
      var globalFileNameCode = 'var filename = "' + moduleName + '";';
      var moduleParamsString = moduleParams.join(', ');

      return defineTemplate
         .replace(/\/\*#GLOBAL_FILE_NAME#\*\//g, generateReturnValueFunction(globalFileNameCode))
         .replace(/\/\*#TEMPLATE#\*\//g, generateReturnValueFunction(template))
         .replace(/\/\*#MODULE_EXTENSION#\*\//g, generateReturnValueFunction(moduleExtension))
         .replace(/\/\*#MODULE_PARAMS#\*\//g, generateReturnValueFunction(moduleParamsString))
         .replace(/\/\*#PRIVATE_TEMPLATES#\*\//g, generateReturnValueFunction(privateTemplates))
         .replace(/\/\*#INCLUDED_TEMPLATES#\*\//g, generateReturnValueFunction(includedTemplates))
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, 'true')
         .replace(/\/\*#MODULE_NAME#\*\//g, generateReturnValueFunction(moduleName))
         .replace(/\/\*#LOCAL_DEPENDENCIES#\*\//g, generateReturnValueFunction(dependenciesList + localDependenciesList))
         .replace(/\/\*#DEPENDENCIES#\*\//g, generateReturnValueFunction(JSON.stringify(finalDependencies)))
         .replace(/\/\*#REACTIVE_PROPERTIES#\*\//g, generateReturnValueFunction(JSON.stringify(reactiveProperties)));
   }

   function generateTmplDefine(moduleName, moduleExtension, templateFunction, dependencies, reactiveProperties, hasTranslations, useReact) {
      var index;
      var mainTemplateFunctionName = templateFunction.name;
      if (mainTemplateFunctionName === 'anonymous' || mainTemplateFunctionName === undefined) {
         mainTemplateFunctionName = 'template';
      }
      var template = templateFunction.toString()
         .replace('function anonymous', 'function ' + mainTemplateFunctionName);
      var dependenciesList = '';
      var headDependencies = [
         'UI/Executor'
      ];

      var moduleParams = ['Executor'];
      if (hasTranslations) {
         headDependencies.push('i18n!' + moduleName.split('/')[0]);
         moduleParams.push('rk');
      }
      if (useReact) {
         headDependencies.push('react');
         moduleParams.push('React');
      }
      if (dependencies) {
         for (index = 0; index < dependencies.length; ++index) {
            dependenciesList += '_deps["' + dependencies[index] + '"] = deps[' + (index + headDependencies.length) + '];';
         }
      }

      var finalDependencies = headDependencies.concat(dependencies);
      var moduleParamsString = moduleParams.join(', ');
      return defineTemplate
         .replace(/\/\*#GLOBAL_FILE_NAME#\*\//g, EMPTY_STRING)
         .replace(/\/\*#TEMPLATE#\*\//g, generateReturnValueFunction(template))
         .replace(/\/\*#MODULE_EXTENSION#\*\//g, generateReturnValueFunction(moduleExtension))
         .replace(/\/\*#MODULE_PARAMS#\*\//g, generateReturnValueFunction(moduleParamsString))
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
    * @param cycleIndex Уникальный индекс цикла в рамках одной единицы компиляции.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateFor(init, test, update, processedBlock, cycleIndex) {
      return forTemplate
         .replace(/\/\*#CYCLE_INDEX#\*\//g, generateReturnValueFunction(cycleIndex))
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
    * @param cycleIndex Уникальный индекс цикла в рамках одной единицы компиляции.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateForeach(scopeArray, forSource, processedBlock, cycleIndex) {
      var iteratorScope = JSON.stringify({
         key: forSource.key,
         value: forSource.value
      });
      return foreachTemplate
         .replace(/\/\*#CYCLE_INDEX#\*\//g, generateReturnValueFunction(cycleIndex))
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
    * @param hasTranslations Флаг наличия в единице трансляции конструкции локализации.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateTemplateBody(fileName, markupGeneration, hasTranslations) {
      var initRkFunction = EMPTY_STRING;
      if (hasTranslations) {
         initRkFunction = 'var rk = thelpers.getRk(filename);';
      }
      return bodyTemplate
         .replace(/\/\*#INITIALIZE_RK_FUNCTION#\*\//g, generateReturnValueFunction(initRkFunction))
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
    * @param useReact Флаг генерации кода для React.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateObjectTemplate(template, internal, postfix, isWasabyTemplate, useReact) {
      var postfixCall = postfix || '';
      if (useReact) {
         // TODO: Implement
         return objectTemplateReact
            .replace('/*#TEMPLATE#*/', generateReturnValueFunction(template))
            .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, isWasabyTemplate)
            .replace('/*#INTERNAL#*/', generateReturnValueFunction(internal)) + postfixCall;
      }
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
    * @param useReact Флаг генерации кода для React.
    * @returns {string} Сгенерированный блок кода.
    */
   function generateIncludedTemplate(template, internal, postfix, isWasabyTemplate, useReact) {
      var postfixCall = postfix || '';
      if (useReact) {
         return includedTemplateReact
            .replace('/*#TEMPLATE#*/', generateReturnValueFunction(template))
            .replace('/*#TEMPLATE_JSON#*/', generateReturnValueFunction(template))
            .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, isWasabyTemplate);
      }
      return includedTemplate
         .replace('/*#TEMPLATE#*/', generateReturnValueFunction(template))
         .replace('/*#TEMPLATE_JSON#*/', generateReturnValueFunction(template))
         .replace(/\/\*#IS_WASABY_TEMPLATE#\*\//g, isWasabyTemplate)
         .replace('/*#INTERNAL#*/', generateReturnValueFunction(internal)) + postfixCall;
   }

   /**
    * Сгенерировать private шаблон
    * @param body {string} Тело шаблона.
    * @returns {string} Сгенерированный блок кода.
    */
   function generatePrivateTemplate(body) {
      return privateTemplate
         .replace('/*#BODY#*/', generateReturnValueFunction(body));
   }

   /**
    * Сгенерировать заголовок private шаблона
    * @param name {string} Имя шаблона.
    * @param body {string} Тело шаблона.
    * @returns {string} Сгенерированный блок кода.
    */
   function generatePrivateTemplateHeader(name, body) {
      return privateTemplateHeader
         .replace('/*#NAME#*/', generateReturnValueFunction(name))
         .replace('/*#TEMPLATE_FUNCTION#*/', generateReturnValueFunction(body));
   }

   /**
    * Сгенерировать partial шаблон
    * @returns {string} Сгенерированный блок кода.
    */
   function generatePartialTemplate() {
      return partialTemplateHeader;
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
