/**
 * Parsing step
 * Traversing/parsing AST-html tree
 */
define('UI/_builder/Tmpl/core/_deprecated/traverse', [
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'Core/Deferred',
   'Core/ParallelDeferred',
   'UI/Utils',
   'UI/_builder/Tmpl/expressions/_private/Statement',
   'UI/_builder/Tmpl/expressions/_private/Event',
   'UI/_builder/Tmpl/expressions/_private/Bind',
   'UI/_builder/Tmpl/expressions/_private/i18n',
   'UI/_builder/Tmpl/expressions/_private/Parser',
   'UI/_builder/Tmpl/modules/utils/names',
   'UI/_builder/Tmpl/modules/utils/common',
   'UI/_builder/Tmpl/modules/utils/tag',
   'UI/_builder/Tmpl/modules/utils/loader',
   'UI/_builder/Tmpl/core/_deprecated/postTraverse'
], function traverseLoader(
   ErrorHandlerLib,
   Deferred,
   ParallelDeferred,
   uiUtils,
   processStatement,
   event,
   bindUtils,
   i18n,
   ParserLib,
   names,
   utils,
   tagUtils,
   straightFromFile,
   postTraverse
) {
   'use strict';

   /**
    * @deprecated
    * @description Старый механизм traverse.
    * @author Крылов М.А.
    * @file UI/_builder/Tmpl/core/_deprecated/traverse.js
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

   var DATA_TYPE_NODES = [
      'ws:array',
      'ws:boolean',
      //'ws:function',
      'ws:number',
      'ws:object',
      'ws:string',
      'ws:value'
   ];

   var parser = new ParserLib.Parser();

   var concreteSourceStrings = {
      splittingKey: ' in ',
      key: ' as ',
      keyAlt: ','
   };

   /**
    * Проверяем есть ли атрибуты, для упрощения разбора на этапе парсинга
    * @param entity
    * @returns {*}
    */
   function checkForAttributes(entity) {
      if (entity.attribs && uiUtils.ObjectUtils.isEmpty(entity.attribs)) {
         entity.attribs = undefined;
      }
      return entity;
   }

   function getErrorMessage(err) {
      var message = err.message.split('Expecting')[0];
      message = message.split('line')[0] + 'line:' + message.slice(message.indexOf(':') + 1);
      return message;
   }

   /**
    * Для проверки на то, есть ли вставленные теги данных
    * @param data
    * @returns {boolean}
    */
   function isDataInjected(data) {
      var emptySpace = ' ';
      if (data.length > 0) {
         for (var i = 0; i < data.length; i++) {
            if (data[i].data !== emptySpace) {
               return true;
            }
         }
      }
      return false;
   }

   function innerTemplateErrorLog(fileName, innerTemplate, ast) {
      return new Error(
         'Required template or control in file ' + fileName + ' did not return AST for ' + innerTemplate +
         '. AST RESULT: ' + ast
      );
   }

   function createOptionalTag(templateName) {
      return {
         value: templateName,
         type: 'optional'
      };
   }

   function createTemplateTagName(templateName) {
      return {
         value: templateName,
         type: 'template'
      };
   }

   function createSimpleControlTagName(templateName) {
      return {
         value: templateName,
         type: 'ws-control',
         simple: true
      };
   }

   function createLibraryModuleTagName(templateName) {
      var libPath = utils.splitModule(templateName);
      return {
         libPath: libPath,
         value: libPath.fullName,
         type: 'ws-module',
         simple: true
      };
   }

   /**
    * Safe replacing
    */
   var safeReplaceCaseReg = /\r|\n|\t|\/\*[\s\S]*?\*\//g;

   /**
    * Safe placeholder
    */
   var safeReplaceCasePlace = '';

   function createForConfig(key, value, main) {
      return {
         key: key,
         value: value,
         main: main
      };
   }

   function findForAllArguments(value, main) {
      var crStringArray = value.split(concreteSourceStrings.key),
         entityWhichIterates = crStringArray[0],
         key;
      if (crStringArray.length > 1) {
         entityWhichIterates = crStringArray[1];
         key = crStringArray[0];
      } else {
         crStringArray = utils.removeAllSpaces(value).split(concreteSourceStrings.keyAlt);
         if (crStringArray.length > 1) {
            entityWhichIterates = crStringArray[1];
            key = crStringArray[0];
         }
      }
      return createForConfig(key, entityWhichIterates, main);
   }

   function _traverseDirective(directive) {
      var deferred = new Deferred();
      deferred.callback(directive);
      return deferred;
   }

   /**
    * Accepting tag to the AST
    * @param tag
    * @param attribs
    * @returns {Object}
    */
   function _acceptTag(tag, attribs) {
      return {
         name: tag.name,
         data: tag.data,
         key: tag.key,
         attribs: attribs,
         children: tag.children,
         selfclosing: !!tag.selfclosing,
         type: 'tag',

         // TODO: Служебная информация. Сейчас она перетирается. Будет исправлено по задаче
         //  https://online.sbis.ru/opendoc.html?guid=e238a42e-fedf-4601-bb71-e77dd475cff6
         attributes: tag.attributes,
         isSelfClosing: tag.isSelfClosing,
         isVoid: tag.isVoid,
         originName: tag.name,
         position: tag.position
      };
   }

   /**
    * Removing unnecessary stuff from strings
    * @param  {String} string   data string
    * @return {String}         clean data string
    */
   function _replaceAllUncertainStuff(string) {
      // С флагом global у регулярного выражения нужно сбрасывать индекс
      safeReplaceCaseReg.lastIndex = 0;
      return string.replace(safeReplaceCaseReg, safeReplaceCasePlace);
   }

   /**
    * Generating tag and tag childs
    * @param  {Object} tag   tag
    * @param  {Array} inner children
    * @return {Object}      Tag
    */
   function _generatorFunctionForTags(tag, inner) {
      tag.children = actionOnMainArray([], inner);
      return tag;
   }

   /**
    * Perform action on main data array
    * @param  {Array} modAST         AST array
    * @param  {Object|Array} traverseObject object or array of objects with tag or text
    * @return {Array}                AST array
    */
   function actionOnMainArray(modAST, traverseObject) {
      if (traverseObject !== undefined && traverseObject.length > 0) {
         for (var i = 0; i < traverseObject.length; i++) {
            if (traverseObject[i]) {
               modAST.push(traverseObject[i]);
            }
         }
      }
      return modAST;
   }

   /**
    *  Looking for variables in strings
    * @param  {Object} statement   string statement
    * @param config
    * @return {Object}             data object { data: { type: "text", value: 'wadawd' } }
    */
   function _lookForStatements(statement, config) {
      if (statement) {
         // исследуем строку на наличие локализуемых слов
         statement.data = i18n.findLocaleVariables(statement.data, config);
         return processStatement.replaceMatch(statement);
      }
      return undefined;
   }

   function _checkIsPropertyName(name) {
      return name && name.indexOf('ws:') === 0 && DATA_TYPE_NODES.indexOf(name.toLowerCase()) === -1;
   }

   function createControlTagName(tag) {
      var name = {
         value: null,
         type: 'ws-control'
      };
      var nameVal = tag.name.trim();
      if (nameVal === 'control') {
         name.value = tag.attribs['data-component'];
      } else if (utils.isLibraryModuleString(nameVal)) {
         name.libPath = utils.splitModule(nameVal);
         name.value = name.libPath.fullName;
         name.type = 'ws-module';
      } else {
         name.value = tagUtils.splitWs(nameVal);
      }
      return name;
   }

   var traverse = {

      /**
       * Include promises stack
       * @type {Object}
       */
      includeStack: { },
      reservedCanBeOptions: ['ws:template'],
      restrictedTags: ['script'],

      /**
       * Attribute traverse in order to find variables
       * @return {Array}        array of attributes with variables
       * @param attribs
       */
      _traverseTagAttributes: function traverseTagAttributes(attribs) {
         var dataAttributes = utils.clone(attribs);
         return utils.eachObject(dataAttributes, function traverseTagAttributesEach(attrib, titleAttribute) {
            var res;

            // храню в состоянии название опции компонента, используется в traverse
            // для локализации (проверяется, локализуема ли текущая опция)
            // храню массивом путь до опции, ведь опция может быть внутри других опций
            this._optionName = this._optionName || [];
            this._optionName.push(titleAttribute);
            try {
               if (event.isEvent(titleAttribute) || bindUtils.isBind(titleAttribute)) {
                  res = {
                     data: [
                        processStatement.processProperty(attrib)
                     ],
                     type: 'text',
                     property: true
                  };
               } else {
                  // Включил поддержку boolean-атрибутов. У них значение - null
                  res = this._traverseText({
                     data: (attrib || '')
                  });
               }
            } catch (error) {
               throw new Error(
                  'Задано некорректное значение "' + attrib + '" на атрибуте "' + titleAttribute + '" в файле ' + this.fileName
               );
            } finally {
               this._optionName.pop();
            }
            return res;
         }.bind(this));
      },
      _traverseTag: function traverseTag(name, injectedData) {
         if (injectedData && this.reservedCanBeOptions.indexOf(name) !== -1) {
            return this._handlingTag;
         }
         if (name === 'ws:template' || name === 'ws:partial' || name === 'ws:for') {
            return this._traverseModule;
         }
         if (tagUtils.checkForControl(name, injectedData, false, false)) {
            return this._traverseOptionModule;
         }
         return this._handlingTag;
      },

      /**
       * Resolving method to handle tree childs
       * @param  {Object} entity  tag, text or module
       * @param data
       * @return {Function}       traverse method to use
       */
      _whatMethodShouldYouUse: function whatMethodShouldYouUse(entity, data) {
         var type = utils.capitalize(entity.type);
         var functionName = '_traverse' + type;
         if (Array.isArray(this.config.ignored) && this.config.ignored.indexOf(entity.type) > -1) {
            return undefined;
         }
         if (entity.type === 'tag' || entity.type === 'style' || entity.type === 'script') {
            return this._traverseTag(entity.name, data);
         }
         if (entity.type === 'directive' || entity.type === 'comment' || entity.type === 'text') {
            return this[functionName];
         }
         return undefined;
      },

      /**
       * Collecting states from traversing tree
       * @param  {Function} traverseMethod traverse function for entity
       * @param  {Object} value          Tag, text or module
       * @param injectedData
       * @return {Object}                State promise
       */
      _collect: function collect(traverseMethod, value, injectedData) {
         return traverseMethod.call(this, value, injectedData);
      },

      /**
       * Traversing ast
       * @param  {Array} ast AST array
       * @param prefix
       * @param injectedData
       * @return {Array}    array of State promises
       */
      traversingAST: function traversingAST(ast, prefix, injectedData) {
         var traverseMethod;
         var pDeferred = new ParallelDeferred();
         var keyIndex = 0;
         var collect;
         var parentKey = '';
         for (var i = 0; i < ast.length; i++) {
            traverseMethod = this._whatMethodShouldYouUse(ast[i], injectedData);
            if (traverseMethod) {
               if (ast[i].type === 'tag') {
                  if (ast[i].parent) {
                     if (
                        (
                           ast[i].parent.children && ast[i].parent.children[0] &&
                           ast[i].parent.children[0].fn && (
                              names.isControlString(ast[i].parent.children[0].fn) ||
                              names.isSlashedControl(ast[i].parent.children[0].fn)
                           )
                        ) ||
                        ast[i].parent.name === 'ws:partial' ||
                        ast[i].parent.name === 'ws:for'
                     ) {
                        parentKey = '';
                     } else {
                        parentKey = (ast[i].parent ? (ast[i].parent.key) : '');
                     }
                  }
                  ast[i].key = parentKey + (keyIndex++) + '_';
                  ast[i].prefix = prefix;
               }
               if (ast[i].type === 'text' || ast[i].type === 'style' || ast[i].type === 'script') {
                  parentKey = (ast[i].parent ? (ast[i].parent.key) : '');
                  ast[i].key = parentKey + (keyIndex++) + '_';
                  ast[i].prefix = prefix;
               }
               ast[i] = checkForAttributes(ast[i]);
               try {
                  if (injectedData && _checkIsPropertyName(ast[i].name)) {
                     this._optionName.push(ast[i].name.replace('ws:', ''));
                  }
                  collect = this._collect(traverseMethod, ast[i], injectedData);
               } finally {
                  if (injectedData && _checkIsPropertyName(ast[i].name)) {
                     this._optionName.pop();
                  }
               }
               if (collect !== undefined) {
                  pDeferred.push(collect);
               }
            }
         }
         return pDeferred.done().getResult().addCallbacks(
            function resolveNodesToArray(data) {
               return Object.keys(data).map(function(key) {
                  return data[key];
               });
            }, function failedTraverse(error) {
               return error;
            }
         );
      },

      /**
       * Starting point
       * @param  {Array} ast    [description]
       * @param resolver
       * @param config
       * @return {Object}       State promise
       */
      traverse: function traverse(ast, resolver, config) {
         var deferred = new Deferred();
         if (resolver) {
            this.resolver = resolver;
            if (config) {
               this.fileName = config.fileName;
               this.isWasabyTemplate = config.isWasabyTemplate;
               this.config = config.config;
               this.fromBuilderTmpl = config.fromBuilderTmpl;

               // опция говорит о том, что нужно собирать словарь локализуемых слов
               this.createResultDictionary = config.createResultDictionary;

               // информация о компонентах, полученная из билдера модулем jsDoc,
               // используется для проверки, локализуемы ли опции
               this.componentsProperties = config.componentsProperties;
               if (this.createResultDictionary) {
                  this.words = [];
               }
            }
         }
         this.traversingAST(ast).addCallbacks(
            postTraverse.bind(this, deferred),
            function broken(fileName, error) {
               deferred.errback(error);
               errorHandler.critical(
                  error.message,
                  {
                     fileName: fileName
                  }
               );
            }.bind(null, this.fileName)
         );
         return deferred;
      },

      /**
       * Traversing tag with children
       * @param  {Object} tag
       * @param injectedData
       * @return {Object}         State promise
       */
      traverseTagWithChildren: function traverseTagWithChildren(tag, injectedData) {
         var deferred = new Deferred();
         var fileName = this.fileName;
         this.traversingAST(tag.children, tag.prefix, injectedData).addCallbacks(
            function traverseTagSuccess(ast) {
               var result = _generatorFunctionForTags(tag, ast);
               deferred.callback(result);
            },
            function brokenTagTraversing(error) {
               deferred.errback(error);
               errorHandler.critical(
                  error.message,
                  {
                     fileName: fileName
                  }
               );
            }
         );
         return deferred;
      },

      /**
       * Traverse manageable attributes from _attributeModules
       * @param attribs
       * @returns {Array}
       */
      _traverseManageableAttributes: function traverseManageableAttributes(attribs) {
         var constructArray = [], attrib;
         for (attrib in attribs) {
            if (attrib === 'for') {
               constructArray.push({
                  module: attrib,
                  value: attribs[attrib]
               });
            }
         }
         return constructArray;
      },

      /**
       * Apply module function on tag with manageable attributes
       * @param tag
       * @param injectedData
       * @returns {*}
       */
      _useManageableAttributes: function useManageableAttributes(tag, injectedData) {
         var constructArray = this._traverseManageableAttributes(tag.attribs);
         if (constructArray.length > 0) {
            var moduleName = constructArray.shift().module;

            // если элемент - label, нужно рассматривать его атрибут for как уникальный идентификатор
            // http://htmlbook.ru/html/label/for, а не как цикл в tmpl
            if (moduleName === 'for' && tag.name === 'label') {
               return this._generateTag(tag, injectedData);
            }
            if (moduleName === 'for') {
               return this._forParse(tag);
            }
            throw new Error('Unknown module to parse "' + moduleName + '"');
         }
         return this._generateTag(tag, injectedData);
      },

      /**
       * Checking tag for manageable attributes
       * @param tag
       * @param injectedData
       * @returns {*}
       */
      _checkForManageableAttributes: function checkForManageableAttributes(tag, injectedData) {
         if (tag.attribs) {
            return this._useManageableAttributes(tag, injectedData);
         }
         return this._generateTag(tag, injectedData);
      },

      /**
       * Generating tag object
       * @param tag
       * @param injectedData
       * @returns {*}
       */
      _generateTag: function generateTag(tag, injectedData) {
         var deferred = new Deferred();
         var attribs;
         var takeTag;
         var result;
         try {
            attribs = this._traverseTagAttributes(tag.attribs);
            takeTag = _acceptTag(tag, attribs);
            if (takeTag.children && takeTag.children.length > 0) {
               this._oldComponentInside = this._oldComponentInside || 0;
               this._scriptInside = this._scriptInside || 0;
               this._styleInside = this._styleInside || 0;
               if (takeTag.name === 'component') {
                  this._oldComponentInside++;
               }
               if (takeTag.name === 'script') {
                  this._scriptInside++;
               }
               if (takeTag.name === 'style') {
                  this._styleInside++;
               }
               try {
                  result = this.traverseTagWithChildren(takeTag, injectedData);
               } finally {
                  if (takeTag.name === 'component') {
                     this._oldComponentInside--;
                  }
                  if (takeTag.name === 'script') {
                     this._scriptInside--;
                  }
                  if (takeTag.name === 'style') {
                     this._styleInside--;
                  }
               }
               return result;
            }
            deferred.callback(_generatorFunctionForTags(takeTag));
         } catch (error) {
            errorHandler.critical(
               'Ошибка разбора шаблона: ' + error.message,
               {
                  fileName: this.fileName
               }
            );
            deferred.errback(error);
         }
         return deferred;
      },

      /**
       * Main function for tag traversing
       * @param  {Object} tag
       * @param injectedData
       * @return {Object}     State promise
       */
      _handlingTag: function handlingTag(tag, injectedData) {
         return this._checkForManageableAttributes(tag, injectedData);
      },

      /**
       * Traverse requirable tag
       * @param tag
       * @returns {Array}
       */
      _traverseOptionModule: function traverseOptionModule(tag) {
         return this._parseControl(_acceptTag(tag, tag.attribs));
      },

      _parseControl: function(tag) {
         var name;
         tag.key = tag.prefix ? tag.prefix + '-' + tag.key : tag.key;
         var tagNameIndexOfColon = tag.name.indexOf(':');

         // игнорируем те теги у которых есть ws:
         var wasCol = tagNameIndexOfColon > 2 || tagNameIndexOfColon === -1;
         tag.name = tagUtils.resolveModuleName(tag.name);
         name = createControlTagName(tag);
         name.simple = wasCol;

         if (!this.includeStack[name.value]) {
            this.includeStack[name.value] = straightFromFile.call(this, name);
         }
         if (tag.attribs === undefined) {
            tag.attribs = { };
         }

         /**
          * Активный атрибут для вычисление модуля для require в шаблонизаторе.
          * Сделано для того чтобы освободить такое популярное опции - template!
          * @private
          */
         tag.attribs._wstemplatename = name.value;
         return this._partialParse(tag);
      },

      /**
       * Main function for finding traverse method for module
       * @param  {Object} tag
       * @return {Array}     Module function
       */
      _traverseModule: function traverseModule(tag) {
         var normalizedTag = _acceptTag(tag, tag.attribs);
         var moduleName = normalizedTag.name;
         if (moduleName === 'ws:template') {
            return this._templateParse(normalizedTag);
         }
         if (moduleName === 'ws:partial') {
            return this._partialParse(normalizedTag);
         }
         if (moduleName === 'ws:for') {
            return this._forParse(normalizedTag);
         }
         throw new Error('Unknown module to parse "' + moduleName + '"');
      },

      _partialParse: function(tag) {
         var tagData = tag.children;
         if (tag.name === 'ws:partial' && tag.attribs.template) {
            tag.attribs._wstemplatename = tag.attribs.template;
         }
         var res, name, attribs;
         if (tag.attribs._wstemplatename === undefined) {
            errorHandler.critical(
               'No template tag for partial ' + tag.name,
               {
                  fileName: this.fileName
               }
            );
         }

         // храню в состоянии название компонента, используется в traverse
         // для локализации (получение локализуемых слов из словаря по имени компонента)
         this._currentPartialName = this._currentPartialName || [];
         if (tag.name === 'ws:partial') {
            name = tag.attribs.template.replace('optional!', '');
         } else {
            name = tag.name.replace('ws:', '');
         }
         this._currentPartialName.push(name);
         try {
            attribs = this._traverseTagAttributes(tag.attribs);
            tag.attribs = attribs;
            if (attribs._wstemplatename.data.length > 0) {
               return this._resolveInjectedTemplate(tag, tagData);
            }

            // Посмотрим что это за шаблон
            // html!..., tmpl!...., SBIS3.CONTROLS или инлайн-шаблон
            res = this._checkRequirableTemplate(tag, tagData);
         } finally {
            this._currentPartialName.pop();
         }
         return res;
      },

      _checkRequirableTemplate: function(tag, tagData) {
         var tplName = tag.attribs._wstemplatename.data.value.trim(), name;
         if (names.isStringModules(tplName, this.config)) {
            if (names.isControlString(tplName) || names.isSlashedControl(tplName)) {
               if (utils.isLibraryModuleString(tplName)) {
                  name = createLibraryModuleTagName(tplName);
               } else {
                  name = createSimpleControlTagName(tplName);
               }
               if (tag.attribs === undefined) {
                  tag.attribs = {};
               }
               tag.attribs._wstemplatename = name.value;
            } else if (names.isOptionalString(tplName)) {
               name = createOptionalTag(tplName);
            } else {
               name = createTemplateTagName(tplName);
            }
            if (!this.includeStack[name.value]) {
               this.includeStack[name.value] = straightFromFile.call(this, name);
            }
         }
         return this._resolveTemplateProcess(tag, tagData, tplName);
      },

      _resolveTemplateProcess: function(tag, tagData, template) {
         var def = new Deferred();
         if (this.includeStack[template] === undefined) {
            errorHandler.critical(
               'Requiring tag for "' + template + '" is not found!',
               {
                  fileName: this.fileName
               }
            );
            def.errback(new Error('Requiring tag for "' + template + '" is not found!'));
         } else {
            this.includeStack[template].addCallbacks(
               function partialInclude(modAST) {
                  if (modAST) {
                     tag.children = modAST;
                     if (tagData && isDataInjected(tagData)) {
                        this.traversingAST(tagData, tag.key, true).addCallbacks(
                           function dataTraversing(tagDataAst) {
                              if (tagDataAst) {
                                 tag.injectedData = tagDataAst;
                                 def.callback(tag);
                              } else {
                                 def.errback(innerTemplateErrorLog(this.fileName, template, tagDataAst));
                              }
                           }.bind(this),
                           function resolveInjectedDataErr(reason) {
                              def.errback(reason);
                           }
                        );
                     } else {
                        def.callback(tag);
                     }
                  } else {
                     def.errback(innerTemplateErrorLog(this.fileName, template, modAST));
                  }
                  return modAST;
               }.bind(this),
               function brokenPartial(reason) {
                  def.errback(reason);
                  errorHandler.critical(
                     reason.message,
                     {
                        fileName: this.fileName
                     }
                  );
               }.bind(this)
            );
         }
         return def;
      },

      _resolveInjectedTemplate: function(tag, tagData) {
         var def = new Deferred();
         var template = tag.attribs._wstemplatename.data;
         tag.injectedTemplate = template[0];
         if (tagData && isDataInjected(tagData)) {
            this.traversingAST(tagData, tag.key, true).addCallbacks(
               function dataTraversing(tagDataAst) {
                  if (tagDataAst) {
                     tag.injectedData = tagDataAst;
                     def.callback(tag);
                  } else {
                     def.errback('Something wrong with template ' + this.fileName + '.');
                  }
               }.bind(this),
               function resolveInjectedDataErr(reason) {
                  def.errback(reason);
               }
            );
         } else {
            def.callback(tag);
         }
         return def;
      },

      _templateParse: function(tag) {
         var tagStates, name;
         try {
            name = tag.attribs.name.trim();
         } catch (e) {
            errorHandler.critical(
               'Something wrong with name attribute in ws:template tag: ' + e.message,
               {
                  fileName: this.fileName
               }
            );
         }
         if (tag.children === undefined || tag.children.length === 0) {
            errorHandler.critical(
               'There is got to be a children in ws:template tag',
               {
                  fileName: this.fileName
               }
            );
         }
         tagStates = this._continueTemplateParse(tag);
         this.includeStack[name] = tagStates.fake;
         return tagStates.real;
      },

      _continueTemplateParse: function(tag) {
         var fakeDeferred = new Deferred(), realDeferred = new Deferred();
         this.traversingAST(tag.children).addCallbacks(
            function partialTraversing(modAST) {
               fakeDeferred.callback(modAST);
               tag.children = modAST;
               realDeferred.callback(tag);
            }, function brokenTraverse(reason) {
               realDeferred.errback(reason);
               errorHandler.critical(
                  reason.message,
                  {
                     fileName: this.fileName
                  }
               );
            }.bind(this)
         );
         return {
            fake: fakeDeferred,
            real: realDeferred
         };
      },

      _forParse: function(tag) {
         var def = new Deferred(),
            forStampArguments,
            source = '',
            fromAttr = tag.attribs.hasOwnProperty('for');
         try {
            if (fromAttr) {
               source = utils.clone(tag.attribs.for);
            } else {
               source = tag.attribs.data;
            }

            if (source.indexOf(';') > -1) {
               var forArgs = source.split(';');
               tag.attribs.START_FROM = '{{' + forArgs[0] + '}}';
               tag.attribs.CUSTOM_CONDITION = '{{' + forArgs[1] + '}}';
               tag.attribs.CUSTOM_ITERATOR = '{{' + forArgs[2] + '}}';
               delete tag.attribs.data;
            } else {
               forStampArguments = source.split(concreteSourceStrings.splittingKey);
               tag.forSource = findForAllArguments(forStampArguments[0], parser.parse(forStampArguments[1]));
            }
            tag.attribs = this._traverseTagAttributes(tag.attribs);
         } catch (err) {
            var message = getErrorMessage(err);
            errorHandler.critical(
               'Wrong arguments in for statement ' +
               tag.name + ': ' + message,
               {
                  fileName: this.fileName
               }
            );
         }
         this.traversingAST(tag.children).addCallbacks(
            function dataTraversing(tagDataAst) {
               tag.children = tagDataAst;
               def.callback(tag);
            },
            function dataTraversingFailed(reason) {
               def.errback(reason);
            }
         );
         return def;
      },

      /**
       * Text node traversing
       * @param  {Object} text
       * @return {Object}       promise or text
       */
      _traverseText: function traverseText(text) {
         var deferred = new Deferred();
         var statements;
         var choppedText = {
            data: text.data,
            type: 'text',
            key: text.key
         };

         // WARNING: конфиг выше не поднять, тк группа traverse-методов не вызывается явно
         var config = {
            _oldComponentInside: this._oldComponentInside || 0,
            _scriptInside: this._scriptInside || 0,
            _styleInside: this._styleInside || 0,
            createResultDictionary: this.createResultDictionary,
            _currentPartialName: this._currentPartialName,
            _optionName: this._optionName,
            words: this.words,
            fileName: this.fileName,
            componentsProperties: this.componentsProperties
         };
         if (text.hasOwnProperty('type')) {
            text.data = _replaceAllUncertainStuff(choppedText.data);
            try {
               statements = _lookForStatements(choppedText, config);
               deferred.callback(statements);
            } catch (error) {
               errorHandler.critical(
                  error.message,
                  {
                     fileName: this.fileName
                  }
               );
               deferred.errback(error);
            }
            return deferred;
         }
         return _lookForStatements(choppedText, config);
      },
      _traverseDirective: _traverseDirective,
      _traverseComment: function _traverseComment(comment) {
         var deferred = new Deferred();
         if (comment.data) {
            // WARNING: конфиг выше не поднять, тк группа traverse-методов не вызывается явно
            var config = {
               _oldComponentInside: this._oldComponentInside || 0,
               _scriptInside: this._scriptInside || 0,
               _styleInside: this._styleInside || 0,
               createResultDictionary: this.createResultDictionary,
               _currentPartialName: this._currentPartialName,
               _optionName: this._optionName,
               words: this.words,
               fileName: this.fileName,
               componentsProperties: this.componentsProperties
            };
            deferred.callback(_lookForStatements(comment, config));
         }
         return deferred;
      },

      /**
       * Default handler for parsing
       * @param  {Error} error
       * @return
       */
      defaultHandler: function defaultHandler(error) {
         if (error) {
            errorHandler.critical(
               error.message,
               {
                  fileName: this.fileName
               }
            );
         }
      }
   };
   return traverse;
});
