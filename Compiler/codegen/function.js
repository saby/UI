define('Compiler/codegen/function', [
   'Compiler/utils/Helpers',
   'Compiler/expressions/Process',
   'Compiler/expressions/Event',
   'Compiler/modules/utils/common',
   'Compiler/modules/if',
   'Compiler/modules/for',
   'Compiler/modules/else',
   'Compiler/modules/partial',
   'Compiler/modules/template',
   'Compiler/modules/utils/tag',
   'Compiler/modules/data/utils/functionStringCreator',
   'Compiler/utils/ErrorHandler',
   'Compiler/codegen/templates',
   'Compiler/codegen/Generator',
   'Compiler/codegen/TClosure',
   'Compiler/Config'
], function processingModule(
   Helpers,
   Process,
   eventExpressions,
   utils,
   ifModule,
   forModule,
   elseModule,
   partialModule,
   templateModule,
   tagUtils,
   FSC,
   ErrorHandlerLib,
   templates,
   Generator,
   TClosure,
   builderConfig
) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var EMPTY_STRING = '';

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

   function createAttrObject(val) {
      return {
         type: 'text',
         value: val
      };
   }

   function getFuncNameByFile(fileName) {
      return fileName && fileName.replace && fileName

      // Remove require substitution
         .replace(/^(wml|tmpl|html)!/g, EMPTY_STRING)

         // Remove file extension
         .replace(/\.(wml|tmpl|html)$/gi, EMPTY_STRING)

         // Replace path separator and spaces with underscore
         .replace(/[.\-:/\s]/gi, '_')

         // Remove leading digits at the start
         .replace(/^\d+/gi, EMPTY_STRING)

         // Remove any invalid characters
         .replace(/[^\d\w_]/gi, EMPTY_STRING);
   }

   function isFunctionNameConfigurable(func) {
      // Не определять новое имя для функции, если дескриптор этого не позволяет
      // В FF36 <#name>configurable/writable есть false
      var descriptor = Object.getOwnPropertyDescriptor(func, 'name');
      if (!descriptor) {
         return false;
      }
      return descriptor.configurable;
   }

   var processing = {
      name: 'string',

      /**
       * Модули шаблонизатора
       */
      _modules: {
         'if': ifModule,
         'for': forModule,
         'else': elseModule,
         'partial': partialModule,
         'template': templateModule
      },

      /**
       * Модули, использумые в управляющих атрибутах
       */
      _attributeModules: {
         'if': ifModule,
         'for': forModule
      },

      /**
       * Данные контролов
       */
      _controlsData: { },
      handlers: { },
      includeStack: { },
      includedFunctions: { },
      getFuncNameByFile: getFuncNameByFile,
      childrenStorage: [ ],
      getFuncNameByTemplate: function(wsTemplateName) {
         if (typeof wsTemplateName === 'string') {
            return this.getFuncNameByFile(wsTemplateName);
         }
         if (typeof wsTemplateName === 'object' && wsTemplateName.data.type === 'text') {
            return this.getFuncNameByFile(wsTemplateName.data.value);
         }
         return undefined;
      },
      getFuncName: function getFuncName(propertyName, fileName, wsTemplateName) {
         var fnByTmpl = this.getFuncNameByTemplate(wsTemplateName);
         var fnByFile = this.getFuncNameByFile(fileName);
         var functionName = fnByTmpl || fnByFile || propertyName || 'Unknown';

         // Запомнить вычисленное имя функции и определить ее идентификатор в случае повторения имени
         if (this.functionNames) {
            if (functionName in this.functionNames) {
               var idx = this.functionNames[functionName].toString();
               this.functionNames[functionName]++;
               functionName += '_' + idx;
            } else {
               this.functionNames[functionName] = 1;
            }
         }
         if (functionName in this.functionNames) {
            return this.getFuncName(functionName);
         }
         return functionName;
      },
      setFunctionName: function(func, wsTemplateName, fileName, propertyName) {
         // Не определять новое имя для функции, если оно уже существует
         // В IE Отсутствует Function.prototype.name, поэтому здесь необходимо проверять, чтобы name был опеределен
         if (typeof func === 'function' && func.name !== 'anonymous' && func.name !== undefined) {
            return func.name;
         }

         if (!isFunctionNameConfigurable(func)) {
            return this.getFuncName(builderConfig.privateFunctionName);
         }

         var functionName = this.getFuncName(propertyName, fileName, wsTemplateName);

         // В случае, если пришла функция, то нужно определить ее имя
         if (typeof func === 'function') {
            Object.defineProperty(func, 'name', { 'value': functionName, configurable: true });
            return func.name;
         }
         return functionName;
      },

      /**
       * Если не чистить данные контролов, на препроцессоре они будут копиться и
       * для всех пользователей будут приходить лишние данные и контролы,
       * которых нет на странице, будут пытаться зареквайриться
       */
      clearControlsData: function() {
         this._controlsData = { };
      },

      /**
       * Декорирование рутового узла
       */
      decorate: function decorate(attributes) {
         return function decorateRoot(rootAttribs) {
            var currentRootAttribs = rootAttribs || { };
            var attrs = Helpers.shallowClone(currentRootAttribs);
            if (attributes) {
               for (var name in attributes) {
                  if (attrs[name]) {
                     if (attrs[name].data.length > 0) {
                        attrs[name].data.push(createAttrObject(' ' + attributes[name]));
                     } else if (attrs[name].data && !attrs[name].data.length) {
                        attrs[name].data = [attrs[name].data, createAttrObject(' ' + attributes[name])];
                     } else {
                        attrs[name] = {};
                        attrs[name].data = createAttrObject(attributes[name]);
                     }
                  } else {
                     attrs[name] = {};
                     attrs[name].data = createAttrObject(attributes[name]);
                  }
               }
            }
            return attrs;
         };
      },

      /**
       * Получение результирущего объекта
       * @param  {Array} ast  AST array of entities
       * @param  {Object} data Data
       * @param handlers
       * @param attributes
       * @param internal
       * @return {Object}      Generated html-string
       */
      getString: function getString(ast, data, handlers, attributes, internal) {
         var decor = this.decorate(attributes);
         var res = '';

         /**
          * Нам нужно пометить эту функцию, что она генерирует атрибуты для КОРНЕВОГО тега
          * тогда если корневой тег - partial, то есть, эта функция участвует при построении
          * функции внутреннего шаблона, то мы должны замержить еще и те атрибуты, которые
          * были переданы в сгенерированную функцию с родительского шаблона.
          * То есть контрол
          * MyButton имеет внутри себя корнем ws:partial
          * он же в свою очередь создает div
          * Тогда нужно чтобы при создании <MyButton attr:class="привет" />
          * атрибут class долетел до дива
          */
         decor.isMainAttrs = true;
         if (handlers) {
            /**
             * Конфиги переданные в requirejs плагине для шаблонизатора
             * @type {Array|*}
             */
            this.handlers = handlers;
            this.fileName = handlers.fileName;
            this.config = handlers.config;
            this.isWasabyTemplate = handlers.isWasabyTemplate;
         }
         var str = '' + this._process(ast, null, decor);
         if (str) {
            str = '' + str.replace(/\n/g, ' ');
         }
         if (!internal) {
            res += templates.generateTemplateHead();
         }
         res += templates.generateTemplateBody(handlers.fileName, str);
         return res;
      },
      getFunction: function getFunction(ast, data, handlers, attributes, internal) {
         // eslint-disable-next-line no-empty-function
         var func = function() { };
         var str = 'no function';
         try {
            // После аннотации мы знаем имена детей, которые будут находится в _children,
            // эти сведения необходимы в кодогенерации, пробросим их (правда, не самым лучшим образом)
            // до модуля Event
            this.childrenStorage = ast.childrenStorage;

            str = this.getString(ast, data, handlers, attributes, internal);
            // eslint-disable-next-line no-new-func
            func = new Function('data, attr, context, isVdom, sets, forceCompatible, generatorConfig', str);
            func.includedFunctions = this.includedFunctions;
            func.privateFn = this.privateFn;
            func.includedFn = this.includedFn;
            func.functionNames = this.functionNames;
         } catch (error) {
            errorHandler.info(
               '[Compiler/codegen/function:getFunction()] generating function: \n' + str,
               {
                  fileName: handlers.fileName
               }
            );
            throw error;
         }
         this.setFunctionName(func, undefined, this.fileName);
         this.childrenStorage = [ ];
         return func;
      },

      /**
       * Генерация подуключаемого модуля
       * @param tag
       * @param data
       * @param decor
       * @returns {Array}
       */
      _processOptionModule: function processOptionModule(tag, data, decor) {
         var tagModule = partialModule.module.call(this, tag, data, decor);
         return tagModule.call(this, decor);
      },

      /**
       * Для поиска модульных функций
       * @param  {Object} tag  Tag
       * @param  {Object} data Data object
       * @param  {Object} decor
       * @return {Object}      Entity: tag or text
       */
      _processModule: function processModule(tag, data, decor) {
         var moduleName = tagUtils.splitWs(tag.name);
         var moduleFunction = this._modules.hasOwnProperty(moduleName) ? this._modules[moduleName].module : false;
         var tagModule = moduleFunction.call(this, tag, data, decor);
         return tagModule.call(this, decor);
      },

      /**
       * Для загрузки модулей)
       * @param name
       * @returns {Function}
       */
      _processTag: function processTag(name) {
         var modName = tagUtils.splitWs(name);
         if (this._modules[modName] && modName !== 'partial') {
            return this._processModule;
         }
         return this._processEntity;
      },
      _processEntity: function(tag, data, decor, parentNS) {
         if (this._modules[tagUtils.splitWs(tag.name)]) {
            return this._processModule(tag, data, decor);
         }
         if (tagUtils.checkForControl(tag.name, false, false, false)) {
            return this._processOptionModule(tag, data, decor);
         }
         return this._handlingTag(tag, data, decor, parentNS);
      },

      /**
       * Поиск методов шаблонизатора
       * @param  {Object} entity Tag, text, module
       * @return {Function}        Process function
       */
      _whatMethodShouldYouUse: function whatMethodShouldYouUse(entity) {
         var type = utils.capitalize(entity.type), functionName = '_process' + type;
         if (Array.isArray(this.config.ignored) && this.config.ignored.indexOf(entity.type) > -1) {
            return undefined;
         }
         if (entity.type === 'tag' || entity.type === 'style' || entity.type === 'script') {
            return this._processTag(entity.name);
         }
         if (entity.type === 'directive' || entity.type === 'comment' || entity.type === 'text') {
            return this[functionName];
         }
         return undefined;
      },

      /**
       * Линеаризация AST
       * @param  {Object} entity Tag, text
       * @return {String}
       */
      _stopArrs: function stopArrs(entity) {
         var string = '';
         var i;
         if (Array.isArray(entity)) {
            for (i = 0; i < entity.length; i++) {
               string += entity[i];
            }
            return string;
         }
         return entity;
      },

      /**
       * Поиск модулей в AST
       * @param  {Object} entity Tag, text, module
       * @param  {Object} data   Data object
       * @param prev
       * @param next
       * @param decor
       * @param parentNS
       * @return {String}        Generated string
       */
      _seek: function _seek(entity, data, prev, next, decor, parentNS) {
         var method = this._whatMethodShouldYouUse(entity);
         if (method) {
            entity.prev = prev;
            entity.next = next;
            return this._stopArrs(method.call(this, entity, data, decor, parentNS));
         }
         return undefined;
      },

      /**
       * Генерация текст, с переменными
       * @param  {Array} textData Array of data
       * @param  {Object} data     Data
       * @param bindingObject
       * @param wrapUndef
       * @param needEscape
       * @param isAttribute
       * @param attrib
       * @return {String}
       */
      _processData: function processData(textData, data, bindingObject, wrapUndef, needEscape, isAttribute, attrib) {
         var string = '';
         var i;
         var expressionResult;
         var result = '';
         if (!textData) {
            throw new Error('Ожидались текстовые данные');
         }
         if (textData.length) {
            for (i = 0; i < textData.length; i++) {
               if (bindingObject) {
                  expressionResult = Process.processExpressions(
                     textData[i],
                     data,
                     this.fileName,
                     bindingObject.isControl,
                     bindingObject.rootConfig,
                     bindingObject.propertyName,
                     isAttribute
                  );
               } else {
                  expressionResult = Process.processExpressions(
                     textData[i],
                     data,
                     this.fileName,
                     undefined,
                     undefined,
                     attrib,
                     isAttribute
                  );
               }

               // todo если считаем значение по умолчанию для биндинга,
               //  и пришел скажем 0 или null, все равно вернется пустая строка.
               if (expressionResult !== undefined && expressionResult !== null) {
                  if (textData[i].type === 'var') {
                     if (textData[i].localized === true) {
                        string += '\' + (' + expressionResult + ') + \'';
                     } else {
                        if (wrapUndef) {
                           expressionResult = TClosure.genWrapUndef(expressionResult);
                        }
                        string += '\' + (' + expressionResult + ') + \'';
                     }
                  } else {
                     string += Process.escapeQuotesInString(expressionResult);
                  }
               } else {
                  string += '';
               }
            }
            result = string;
         } else if (needEscape !== false && textData.type === 'text') {
            result = Process.escapeQuotesInString(textData.value);
         } else if (bindingObject) {
            result = Process.processExpressions(
               textData,
               data,
               this.fileName,
               bindingObject.isControl,
               bindingObject.rootConfig,
               bindingObject.propertyName,
               isAttribute
            );
         } else {
            result = Process.processExpressions(
               textData,
               data,
               this.fileName,
               undefined,
               undefined,
               undefined,
               isAttribute
            );
         }
         if (typeof result === 'string') {
            result = FSC.escapeRawYens(result);
         }
         return result;
      },
      _processAttributesObj: function processAttributesObj(attribs, data, tag) {
         var processed;
         var attrib;
         var obj = {
            attributes: { },
            events: { },
            key: FSC.wrapAroundExec('key+"' + tag.key + '"')
         };
         if (attribs) {
            for (attrib in attribs) {
               if (attribs.hasOwnProperty(attrib) && attribs[attrib]) {
                  if (eventExpressions.isEvent(attrib)) {
                     try {
                        obj.events[attrib.toLowerCase()] = eventExpressions.processEventAttribute(
                           attribs[attrib], attrib, data, false, this.fileName, this.childrenStorage
                        );
                     } catch (error) {
                        throw new Error('На теге "' + tag.name + '" значение атрибута "' + attrib + '" некорректно "' + attribs[attrib].data[0].name.string + '": ' + error.message);
                     }
                  } else {
                     var isAttribute = true;

                     // todo хак для атрибута data-bind, там не надо эскейпить значение атрибута, потому что могут быть
                     //  кавычки который должны остаться кавычками,
                     //  это выражение позже будет использоваться для привязки данных
                     if (attrib === 'data-bind') {
                        isAttribute = false;
                     }
                     processed = this._processData(
                        attribs[attrib].data,
                        data,
                        undefined,
                        true,
                        false,
                        isAttribute,
                        attrib
                     );
                     var newAttr = attrib.replace('attr:', '');
                     if (utils.removeAllSpaces(processed) !== '') {
                        obj.attributes[newAttr] = processed;
                     } else if (Array.isArray(this.config.booleanAttributes)) {
                        // FIXME: Необходимо проверять все входящие данные перед выполнением сборки шаблона
                        //  Сейчас множественные this, непонятно на что и куда ссылающиеся, мешают. Избавиться от них
                        if (this.config.booleanAttributes.indexOf(attrib.toLowerCase()) !== -1) {
                           obj.attributes[newAttr] = 'true';
                        }
                     }
                  }
               }
            }
         }
         obj.events = FSC.wrapAroundExec('typeof window === "undefined"?{}:' + FSC.getStr(obj.events));
         return obj;
      },

      /**
       * Генерация строки текста
       * @param  {Object} text Text
       * @param  {Object} data Data
       * @return {String}
       */
      _processText: function processText(text, data) {
         var res = this._processData(text.data, data, undefined, true) || '';
         return Generator.genCreateText("'" + res + "'", "key + '" + text.key + "'") + ', \n';
      },
      _processDirective: function processDirective(directive) {
         return Generator.genCreateDirective("'" + directive.data + "'") + ', \n';
      },
      _processComment: function processComment(directive, data) {
         var res = this._processData(directive.data, data, undefined, true);
         return Generator.genCreateComment("'" + res + "'") + ', \n';
      },

      /**
       * Генерация строки тэга
       * @param tag
       * @param data
       * @param decor
       * @param parentNS
       * @returns {string}
       */
      _generateTag: function generateTag(tag, data, decor, parentNS) {
         var currentParentNS = parentNS;
         if (tag.attribs && tag.attribs.xmlns) {
            currentParentNS = tag.attribs.xmlns;
         } else if (!tag.attribs) {
            tag.attribs = {
               xmlns: currentParentNS
            };
         } else {
            tag.attribs.xmlns = currentParentNS;
         }
         var attribs = typeof decor === 'function' ? decor(tag.attribs) : tag.attribs;
         var processed = this._processAttributesObj(attribs, data, tag);
         Object.keys(processed.attributes).forEach(function(attributeName) {
            processed.attributes[attributeName] = processed.attributes[attributeName]
               .replace(/^' \+ (.*?) \+ '$/g, function(str, p) {
                  return '¥' + p.replace(/\\/g, '\\\\') + '¥';
               });
         });
         var processedStr = FSC.getStr(processed)
            .replace(/\\("|')/g, '$1')
            .replace(/\\\\/g, '\\')
            .replace(/' \+ /g, '" + ')
            .replace(/ \+ '/g, ' + "');
         var children = this._process(tag.children, data, undefined, currentParentNS);
         var attrToDecorate = decor
            ? 'attr'
            : 'attr?{context: attr.context, key: key+"' + tag.key + '"}:{}';
         return Generator.genCreateTag("'" + tag.name + "'", processedStr, children, attrToDecorate) + ', \n';
      },

      /**
       * Генерация тега
       * @param  {Object} tag  Tag
       * @param  {Object} data Array
       * @param decor
       * @param parentNS
       * @return {String}
       */
      _handlingTag: function handlingTag(tag, data, decor, parentNS) {
         return this._generateTag(tag, data, decor, parentNS);
      },

      /**
       * Рекурсивная функция для генерации вёрстки
       * @param  {Array} ast  AST array
       * @param  {Object} data Data
       * @param decor
       * @param parentNS
       * @return {String}
       */
      _process: function process(ast, data, decor, parentNS) {
         var string = '';
         for (var i = 0; i < ast.length; i++) {
            var st = this._seek(ast[i], data, ast[i - 1], ast[i + 1], decor, parentNS);
            if (st) {
               string += st;
            }
         }
         return string;
      }
   };
   return processing;
});
