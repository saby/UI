define('Compiler/modules/data/object', [
   'Compiler/utils/ErrorHandler',
   'Compiler/modules/utils/tag',
   'Compiler/modules/data/utils/dataTypesCreator',
   'Compiler/modules/utils/common',
   'Compiler/modules/data/utils/functionStringCreator',
   'Compiler/modules/utils/parse',
   'Compiler/codegen/templates',
   'Compiler/codegen/TClosure'
], function objectLoader(ErrorHandlerLib, tagUtils, DTC, common, FSC, parseUtils, templates, TClosure) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

   function checkSingleResultData(data, type) {
      return typeof data === 'string' && type !== 'Array';
   }

   function getChildrenData(children) {
      return children && children[0] && children[0].children;
   }

   function variativeTemplate(name) {
      return name === 'ws:if' || name === 'ws:else' || name === 'ws:for';
   }

   function writeObjectEntity(typeFunction, injected, types, scopeData, propName, falsy) {
      try {
         return typeFunction.call(
            this,
            injected,
            types,
            scopeData,
            propName,
            falsy
         );
      } catch (error) {
         throw new Error(
            'Некорректные данные в опции "' + propName + '": ' + error.message + ' в файле ' + this.fileName
         );
      }
   }

   return function objectTag(injected, types, scopeData, propertyName, restricted, root) {
      var tObject = { };
      var objectForMerge = { };
      var templateObject = DTC.createHtmlDataObject([], scopeData);
      var rootTemplateName = 'content';
      var typeFunction;
      var nameExists;
      var i;
      var curatedScope;
      var result;
      var realInjected;
      var propName;
      var useful;
      var stepInto;
      var internalData;
      var html;

      objectForMerge = parseUtils.parseAttributesForData.call(this, {
         attribs: injected.attribs,
         isControl: injected.isControl,
         configObject: objectForMerge,
         rootConfig: injected.rootConfig
      }, scopeData, propertyName, restricted);

      // Если есть служебные опции, делаем разбор их Expression'ов
      if (injected.internal) {
         injected.internal = parseUtils.parseInternalForData.call(
            this,
            injected.internal,
            scopeData, propertyName,
            injected.isControl,
            injected.rootConfig
         );
         internalData = injected.internal;
      } else {
         internalData = {};
      }

      if (objectForMerge && objectForMerge.createdscope) {
         curatedScope = objectForMerge.obj;
      } else {
         curatedScope = objectForMerge;
      }

      realInjected = injected;

      if (injected.children) {
         // eslint-disable-next-line no-param-reassign
         injected = injected.children;
      }

      stepInto = !(Array.isArray(injected) && injected.filter(function(entity) {
         return variativeTemplate(entity && entity.name);
      }).length);

      for (i = 0; i < injected.length; i++) {
         nameExists = tagUtils.splitWs(injected[i].name);
         if (injected[i].children && stepInto) {
            typeFunction = types[nameExists];
            useful = tagUtils.isEntityUsefulOrHTML(nameExists, this._modules);
            if ((propertyName || typeFunction) && !useful) {
               var ln = injected.length;
               if (typeFunction) {
                  if (ln === 1) {
                     var res = writeObjectEntity.call(
                        this,
                        typeFunction,
                        {
                           attribs: injected[i].attribs,
                           internal: injected[i].internal,
                           children: injected[i].children,
                           isControl: realInjected.isControl,
                           rootConfig: realInjected.rootConfig
                        },
                        types,
                        scopeData,
                        propertyName
                     );
                     if (checkSingleResultData(res, nameExists)) {
                        res = DTC.createDataRepresentation(nameExists, res, getChildrenData(injected));
                     }
                     return res;
                  }
               }
               return writeObjectEntity.call(
                  this,
                  types.Array,
                  {
                     attribs: realInjected.attribs,
                     internal: realInjected.internal,
                     children: injected,
                     isControl: realInjected.isControl,
                     rootConfig: realInjected.rootConfig
                  },
                  types,
                  scopeData,
                  propertyName,
                  true
               );
            }

            if (nameExists && !typeFunction && useful) {
               tObject[nameExists] = writeObjectEntity.call(
                  this,
                  types.Object,
                  {
                     attribs: injected[i].attribs,
                     internal: injected[i].internal,
                     children: injected[i].children,
                     isControl: realInjected.isControl,
                     rootConfig: realInjected.rootConfig || curatedScope,
                     rPropName: nameExists
                  },
                  types,
                  scopeData,
                  propertyName ? (propertyName + '/' + nameExists) : nameExists
               );
            } else if (root) {
               /**
                * Если рутовое перечисление. Пишем в массив опции content
                */
               nameExists = rootTemplateName;
               propName = propertyName ? propertyName + '/' + nameExists : nameExists;
               tObject[nameExists] = writeObjectEntity.call(
                  this,
                  types.Object,
                  {
                     attribs: realInjected.attribs,
                     internal: realInjected.internal,
                     children: injected,
                     isControl: realInjected.isControl,
                     rootConfig: realInjected.rootConfig || curatedScope,
                     rPropName: nameExists
                  }, types, scopeData, propName
               );
               break;
            } else {
               return DTC.createDataRepresentation(
                  nameExists,
                  this._processEntity(injected[i], templateObject.data)
               );
            }
         } else {
            templateObject.html.push(injected[i]);
         }
      }

      if (objectForMerge !== undefined) {
         if (objectForMerge.createdscope) {
            result = common.plainMergeAttrs(tObject, curatedScope);
            if (common.isEmpty(result)) {
               // В любом случае нельзя отдавать сам объект. Иначе он будет меняться по ссылке
               // и DirtyChecking не сможет найти изменения и обновить контрол
               tObject = TClosure.genUniteScope(objectForMerge.createdscope, '{}');
            } else {
               tObject = TClosure.genUniteScope(objectForMerge.createdscope, FSC.getStr(result));
            }
         } else {
            tObject = common.plainMergeAttrs(tObject, curatedScope);
         }
      }

      if (templateObject.html.length > 0) {
         var htmlPropertyName = root ? rootTemplateName : realInjected.rPropName;
         html = templateObject.html;

         if (tObject.type === 'string') {
            result = FSC.wrapAroundObject(
               '(' +
               this.getFunction(
                  html, templateObject.data, this.handlers, undefined, true
               ).toString().replace(/\n/g, ' ') +
               ')(Object.create(data), null, context)'
            );
            if (result.indexOf('markupGenerator.createControl(') > -1) {
               /**
                * TODO: слишком много предупреждений в логи
                * FIXME: исправить https://online.sbis.ru/opendoc.html?guid=55610156-2a06-4085-9f19-b713f53cc40f
                * 1. Сократить сообщения так чтобы отображался только fileName для tmpl
                * 2. Включить когда будет полный запрет
                */
               if (typeof window !== 'undefined' && window.leakDetectedMode) {
                  var num = result.indexOf('thelpers.templateError(');
                  var numEnd = result.indexOf(';', num + 1);
                  var message = 'Deprecated - Вы пытаетесь создать компонент внутри опции type=string. PropertyName=' +
                     htmlPropertyName + '. ResultFunction=' + result.substring(num, numEnd);
                  errorHandler.critical(
                     message,
                     {
                        fileName: this.handlers.fileName
                     }
                  );
               }
            }
            return result;
         }

         if (tObject.type === 'function') {
            // Для обработки type="function" в конфигурации компонента
            return FSC.functionTypeHandler(
               this._processData.bind(this),
               html,
               undefined,
               parseUtils.parseAttributesForData
            );
         }

         // Сделано для того чтобы попадала родительская область видимости при применении инлайн-шаблона
         var generatedTemplate = this.getString(html, {}, this.handlers, {}, true);
         var funcText = templates.generateTemplate(htmlPropertyName, generatedTemplate, this.handlers.fileName, false);

         // eslint-disable-next-line no-new-func
         var func = new Function('data, attr, context, isVdom, sets, forceCompatible, generatorConfig', funcText);
         var funcName = this.setFunctionName(func, undefined, undefined, htmlPropertyName);
         this.includedFunctions[htmlPropertyName] = func;
         if (this.privateFn) {
            this.privateFn.push(func);
         }
         var fAsString = '';
         if (this.privateFn) {
            fAsString = funcName;
         } else {
            fAsString = func
               .toString()
               .replace('function anonymous', 'function ' + funcName)
               .replace(/\n/g, ' ');
         }
         var dirtyCh = '';
         var currentInternalForInjected = injected && injected.internal
            ? injected.internal
            : (
               realInjected && realInjected.internal
                  ? realInjected.internal
                  : null
            );
         if (currentInternalForInjected) {
            dirtyCh += FSC.getStr(currentInternalForInjected, htmlPropertyName);
         } else {
            dirtyCh += '{}';
            if (!this.includedFn) {
               dirtyCh += ';';
            }
         }
         if (this.includedFn) {
            templateObject.html = FSC.wrapAroundObject(
               templates.generateIncludedTemplate(
                  fAsString,
                  dirtyCh ? ('isVdom?' + dirtyCh + ':{}') : '{}',
                  undefined,
                  this.isWasabyTemplate
               )
            );
         } else {
            templateObject.html = FSC.wrapAroundObject(
               templates.generateObjectTemplate(
                  fAsString, 'this.func.internal = ' + dirtyCh, undefined, this.isWasabyTemplate
               )
            );
         }
         if (root) {
            tObject[rootTemplateName] = templateObject.html;
            return tObject;
         }
         return templateObject.html;
      }

      if (tObject.type === 'string') {
         return tObject.value || '';
      }
      return tObject;
   };
});
