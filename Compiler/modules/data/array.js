define('Compiler/modules/data/array', [
   'Compiler/utils/ErrorHandler',
   'Compiler/modules/utils/parse',
   'Compiler/modules/utils/tag',
   'Compiler/modules/data/utils/dataTypesCreator',
   'Compiler/modules/data/utils/functionStringCreator',
   'Compiler/codegen/templates'
], function arrayLoader(ErrorHandlerLib, parseUtils, tagUtils, DTC, FSC, templates) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

   function clearPropertyName(propertyName) {
      return propertyName ? propertyName.split('/').pop() : propertyName;
   }

   function generateFunction(htmlPropertyName, html, string, injected) {
      var generatedString, cleanPropertyName = clearPropertyName(htmlPropertyName);
      var wsTemplateName = injected && injected.attribs && injected.attribs._wstemplatename;
      var generatedTemplate = this.getString(html, { }, this.handlers, { }, true);
      var fileName = this.handlers.fileName;
      var funcText = templates.generateTemplate(cleanPropertyName, generatedTemplate, fileName, !!string);
      var dirtyCh = '';
      var functionToWrap;
      var postfixCall = string ? '(Object.create(data), null, context)' : '';

      if (!string) {
         if (!this.includedFn) {
            dirtyCh = 'this.func.internal = ';
         }
         if (injected && injected.internal) {
            dirtyCh += FSC.getStr(injected.internal, cleanPropertyName);
         } else {
            dirtyCh += '{}';
            if (!this.includedFn) {
               dirtyCh += ';';
            }
         }
      }

      // eslint-disable-next-line no-new-func
      var func = new Function('data, attr, context, isVdom, sets, forceCompatible, generatorConfig', funcText);
      this.setFunctionName(func, wsTemplateName, undefined, cleanPropertyName);
      this.includedFunctions[cleanPropertyName] = func;
      if (this.privateFn) {
         this.privateFn.push(func);
         functionToWrap = func.name;
      } else {
         functionToWrap = func
            .toString()
            .replace('function anonymous', 'function ' + func.name)
            .replace(/\n/g, ' ');
      }
      if (this.includedFn) {
         generatedString = templates.generateIncludedTemplate(
            functionToWrap, dirtyCh ? ('isVdom?' + dirtyCh + ':{}') : '{}', postfixCall, this.isWasabyTemplate
         );
      } else {
         generatedString = templates.generateObjectTemplate(
            functionToWrap, dirtyCh, postfixCall, this.isWasabyTemplat
         );
      }

      // eslint-disable-next-line no-new-wrappers
      var finalResult = new String(generatedString);
      finalResult.innerFunction = true;
      return finalResult;
   }

   function reduceFunctionsArrayToOneString(prev, next) {
      return prev + next;
   }

   function arrayTag(injected, types, scopeData, propertyName, falsy) {
      var children;
      var array = [];
      var nameExists;
      var typeFunction;
      var index;
      var arrayAttributes;
      var stringFunctions = false;
      var variableInner;
      var typeName;

      if (injected.children) {
         arrayAttributes = parseUtils.parseAttributesForData.call(this, {
            attribs: injected.attribs,
            isControl: injected.isControl,
            configObject: { },
            rootConfig: injected.rootConfig
         }, scopeData, propertyName, false);
         if (arrayAttributes && arrayAttributes.type === 'string') {
            stringFunctions = true;
         }
         children = injected.children;
         for (index = 0; index < children.length; ++index) {
            nameExists = tagUtils.splitWs(children[index].name);
            if (nameExists) {
               if (children[index].children) {
                  typeFunction = types[nameExists];
                  if (typeFunction) {
                     var res = typeFunction.call(this, {
                        attribs: children[index].attribs,
                        children: children[index].children,
                        isControl: injected.isControl,
                        rootConfig: injected.rootConfig
                     }, types, scopeData, propertyName + '/' + index);
                     if (typeof res === 'string') {
                        variableInner = children && children[0] && children[0].children;
                        res = DTC.createDataRepresentation(nameExists, res, variableInner);
                     }
                     array.push(res);
                  } else if (
                     tagUtils.checkForControl(nameExists, true, true) ||
                     !tagUtils.isEntityUsefulOrHTML(nameExists, this._modules)
                  ) {
                     array.push(DTC.createDataRepresentation(
                        nameExists,
                        generateFunction.call(this, propertyName, [children[index]], stringFunctions, injected)
                     ));
                  } else {
                     typeName = undefined;
                     if (nameExists && nameExists.charAt && nameExists.slice) {
                        typeName = nameExists.charAt(0).toUpperCase() + nameExists.slice(1);
                     }

                     // Если была опечатка в имени типа (например, value вместо Value),
                     // то необходимо вывести соответствующую ошибку
                     if (types[typeName]) {
                        errorHandler.error(
                           'Typo in the type name. Use ws:' + typeName + ' instead of ws:', {
                              fileName: this.fileName
                           }
                        );
                     } else {
                        errorHandler.error(
                           children[index].name + ' property can\'t be in the root of ws:array tag', {
                              fileName: this.fileName
                           }
                        );
                     }
                  }
               }
            } else {
               array.push(DTC.createDataRepresentation(
                  nameExists,
                  generateFunction.call(this, propertyName, [children[index]], stringFunctions, injected)
               ));
            }
         }
         if (stringFunctions) {
            return array.reduce(reduceFunctionsArrayToOneString, '');
         }
      }

      // Не будем применять меры контентных опций массивов
      // к обычным массивам
      if (falsy) {
         return DTC.createDataRepresentation.call(this, 'Array', array);
      }
      return array;
   }

   return arrayTag;
});
