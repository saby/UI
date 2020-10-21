define('UI/_builder/Tmpl/modules/partial', [
   'UI/_builder/Tmpl/modules/data',
   'UI/_builder/Tmpl/modules/utils/names',
   'UI/_builder/Tmpl/expressions/_private/Process',
   'UI/_builder/Tmpl/modules/utils/parse',
   'UI/_builder/Tmpl/modules/data/utils/functionStringCreator',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/codegen/Generator',
   'UI/_builder/Tmpl/codegen/templates',
   'UI/_builder/Tmpl/codegen/TClosure',
   'UI/_builder/Tmpl/codegen/_feature/Partial'
], function partialLoader(
   injectedDataForce, names, Process, parse, FSC, ErrorHandlerLib,
   Generator, templates, TClosure, FeaturePartial
) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = new ErrorHandlerLib.default();

   function calculateData(sequence) {
      var string = '', attrData = sequence.data, i;
      if (attrData.length) {
         if (attrData.length === 1) {
            return attrData[0].value;
         }
         for (i = 0; i < attrData.length; i++) {
            string += attrData[i].value;
         }
         return string;
      }
      return sequence;
   }

   function syncRequireTemplateOrControl(url, preparedScope, decorAttribs, tag) {
      var templateName = calculateData(tag.attribs._wstemplatename);

      // превращаем объект с экранированными значениями (¥) в строку для добавления в шаблон
      var decorInternal = (tag.internal && Object.keys(tag.internal).length > 0) ? FSC.getStr(tag.internal) : null;
      return Generator.genCreateControlResolver(
         templateName.slice(1, -1),
         FSC.getStr(preparedScope),
         decorAttribs,
         FeaturePartial.createTemplateConfig(decorInternal, tag.isRootTag)
      ) + ',';
   }

   function isControl(tag) {
      return !!(
         tag.children &&
         tag.children[0] &&
         tag.children[0].fn &&
         (names.isControlString(tag.children[0].fn) || names.isSlashedControl(tag.children[0].fn))
      );
   }

   function isModule(tag) {
      return !!(
         tag.children &&
         tag.children[0] &&
         tag.children[0].type === 'module'
      );
   }

   function prepareScope(tag, data) {
      return injectedDataForce.call(this, {
         children: tag.injectedData,
         attribs: tag.attribs,
         isControl: isControl(tag),
         internal: tag.internal
      }, data, {
         partial: tag.name === 'ws:partial'
      });
   }

   function getWsTemplateName(tag) {
      if (tag.name === 'ws:partial') {
         if (tag.attribs._wstemplatename.data) {
            return 'ws:' + tag.attribs._wstemplatename.data.value.replace(/^js!/, '');
         }
         return 'ws:' + tag.attribs._wstemplatename.replace(/^js!/, '');
      }
      return tag.name;
   }

   function getLibraryModulePath(tag) {
      // extract library and module names from the tag
      return {
         library: tag.children[0].library,
         module: tag.children[0].module
      };
   }

   var partialM = {
      module: function partialModule(tag, data) {
         function resolveStatement(decor) {
            var assignModuleVar;
            var strPreparedScope;
            var callFnArgs;
            var tagIsModule = isModule(tag);
            var tagIsWsControl = isControl(tag);
            var decorAttribs = tag.decorAttribs || parse.parseAttributesForDecoration.call(
               this, tag.attribs, data, {}, tagIsWsControl, tag
            );
            tag.decorAttribs = decorAttribs;

            var preparedScope = prepareScope.call(this, tag, data);

            // превращаем объекты с экранированными значениями (¥) в строки для добавления в шаблон
            var decorInternal = (tag.internal && Object.keys(tag.internal).length > 0)
               ? FSC.getStr(tag.internal)
               : null;

            var injectedTemplate;
            if (tag.injectedTemplate) {
               injectedTemplate = Process.processExpressions(
                  tag.injectedTemplate, data, this.fileName, undefined, preparedScope
               );

               // Генерируем внедрённый шаблон с рутовой областью видимости
               if (!injectedTemplate) {
                  errorHandler.error(
                     'Your template variable by the name of "' +
                     tag.injectedTemplate.name.string + '" is empty',
                     {
                        fileName: this.fileName
                     }
                  );
               }
               assignModuleVar = injectedTemplate.html || injectedTemplate;
               if (injectedTemplate.data) {
                  preparedScope.__rootScope = injectedTemplate.data;
               }
               if (assignModuleVar) {
                  if (typeof assignModuleVar === 'function') {
                     return assignModuleVar(preparedScope, decorAttribs);
                  }
                  if (typeof assignModuleVar === 'string') {
                     return syncRequireTemplateOrControl(assignModuleVar,
                        FSC.getStr(preparedScope),
                        decor && decor.isMainAttrs
                           ? TClosure.genPlainMergeAttr('attr', FSC.getStr(decorAttribs))
                           : FSC.getStr(decorAttribs),
                        tag);
                  }
               }
               errorHandler.error(
                  'Your template variable by the name of "' +
                  tag.injectedTemplate.name.string + '" is empty',
                  {
                     fileName: this.fileName
                  }
               );
            }

            var createAttribs;
            var createTmplCfg;
            if (tagIsModule || tagIsWsControl) {
               strPreparedScope = FSC.getStr(preparedScope);
               createAttribs = decor
                  ? TClosure.genPlainMergeAttr('attr', FSC.getStr(decorAttribs))
                  : TClosure.genPlainMergeContext('attr', FSC.getStr(decorAttribs));
               createTmplCfg = FeaturePartial.createTemplateConfig(!decorInternal ? '{}' : decorInternal, tag.isRootTag);

               if (tagIsModule) {
                  return Generator.genCreateControlModule(
                     FSC.getStr(getLibraryModulePath(tag)),
                     strPreparedScope,
                     createAttribs,
                     createTmplCfg
                  ) + ',';
               }
               return Generator.genCreateControl(
                  '"' + getWsTemplateName(tag) + '"',
                  strPreparedScope,
                  createAttribs,
                  createTmplCfg
               ) + ',';
            }
            if (tag.children && tag.children[0] && tag.children[0].fn) {
               strPreparedScope = FSC.getStr(preparedScope);
               createAttribs = decor
                  ? TClosure.genPlainMergeAttr('attr', FSC.getStr(decorAttribs))
                  : TClosure.genPlainMergeContext('attr', FSC.getStr(decorAttribs));
               createTmplCfg = FeaturePartial.createTemplateConfig(!decorInternal ? '{}' : decorInternal, tag.isRootTag);
               return Generator.genCreateControlTemplate(
                  '"' + tag.attribs._wstemplatename.data.value + '"',
                  strPreparedScope,
                  createAttribs,
                  createTmplCfg
               ) + ',';
            }

            // Start code generation for construction:
            // <ws:partial template="inline_template_name" />

            var callDataArg = TClosure.genPlainMerge(
               'Object.create(data || {})',
               TClosure.genPrepareDataForCreate(
                  '"_$inline_template"',
                  FSC.getStr(preparedScope),
                  'attrsForTemplate',
                  '{}'
               ),
               'false'
            );
            var callAttrArg = decor
               ? TClosure.genPlainMergeAttr('attr', FSC.getStr(decorAttribs))
               : TClosure.genPlainMergeContext('attr', FSC.getStr(decorAttribs));

            // признак того, что функции у нас разложены
            callFnArgs = '.call(this, scopeForTemplate, attrsForTemplate, context, isVdom), ';

            if (this.includedFn) {
               return '(function() {' +
                  'attrsForTemplate = ' + callAttrArg + '; scopeForTemplate = ' + callDataArg + ';' +
               '}).apply(this),' + tag.attribs._wstemplatename.data.value + callFnArgs;
            }
            var body = this.getString(tag.children, {}, this.handlers, {}, true);
            return '(function(){' +
                  'attrsForTemplate = ' + callAttrArg + '; scopeForTemplate = ' + callDataArg + '' +
               ';}).apply(this),' + templates.generatePartialTemplate(body) + callFnArgs;
         }
         return resolveStatement;
      }
   };
   return partialM;
});
