define('UI/_builder/Tmpl/modules/partial', [
   'UI/_builder/Tmpl/modules/data',
   'UI/_builder/Tmpl/modules/utils/names',
   'UI/_builder/Tmpl/expressions/_private/Process',
   'UI/_builder/Tmpl/modules/utils/parse',
   'UI/_builder/Tmpl/modules/data/utils/functionStringCreator',
   'UI/_builder/Tmpl/codegen/Generator',
   'UI/_builder/Tmpl/codegen/templates',
   'UI/_builder/Tmpl/codegen/TClosure',
   'UI/_builder/Tmpl/codegen/_feature/Partial'
], function partialLoader(
   injectedDataForce, names, Process, parse, FSC,
   Generator, templates, TClosure, FeaturePartial
) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

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

   function cleanAttributesCollection(attributes) {
      var result = {};
      for (var name in attributes) {
         if (attributes.hasOwnProperty(name)) {
            var cleanName = name.replace(/^attr:/gi, '');
            result[cleanName] = attributes[name];
         }
      }
      return result;
   }

   function prepareDataForCodeGeneration(originTag, data) {
      var tag = {
         attribs: Object.assign({}, originTag.attribs),
         internal: Object.assign({}, originTag.internal),
         children: originTag.children,
         injectedData: originTag.injectedData,
         isRootTag: originTag.isRootTag,
         key: originTag.key,
         name: originTag.name,
         next: originTag.next,
         prev: originTag.prev,
         originName: originTag.originName,
         type: originTag.type,
         injectedTemplate: originTag.injectedTemplate
      };
      var tagIsWsControl = isControl(tag);
      var decor = parse.processAttributes.call(this, tag.attribs, data, {}, tagIsWsControl, tag);
      var attributes = decor.attributes;
      var events = decor.events;
      var scope = null;
      if (tag.attribs.hasOwnProperty('scope')) {
         scope = Process.processExpressions(
            tag.attribs.scope.data[0],
            data,
            this.fileName,
            isControl,
            {},
            'scope',
            false
         );
         delete tag.attribs.scope;
      }
      var options = prepareScope.call(this, tag, data);
      var cleanAttributes = cleanAttributesCollection(attributes);
      var internal = (tag.internal && Object.keys(tag.internal).length > 0)
         ? FSC.getStr(tag.internal)
         : '{}';
      var config = FeaturePartial.createConfigNew(internal, tag.isRootTag);
      return {
         attributes: FSC.getStr(cleanAttributes),
         events: FSC.getStr(events),
         options: FSC.getStr(options),
         scope: scope,
         config: config
      };
   }

   var partialM = {
      module: function partialModule(tag, data) {
         function resolveStatement(decor) {
            var strPreparedScope;
            var callFnArgs;
            var tagIsModule = isModule(tag);
            var tagIsWsControl = isControl(tag);

            // TODO: Release new codegen
            // var newConfig = prepareDataForCodeGeneration.call(this, tag, data);
            var decorAttribs = tag.decorAttribs || parse.parseAttributesForDecoration.call(
               this, tag.attribs, data, {}, tagIsWsControl, tag
            );
            tag.decorAttribs = decorAttribs;

            var preparedScope = prepareScope.call(this, tag, data);

            // превращаем объекты с экранированными значениями (¥) в строки для добавления в шаблон
            var decorInternal = (tag.internal && Object.keys(tag.internal).length > 0)
               ? FSC.getStr(tag.internal)
               : null;

            // DynamicPartialNode
            var injectedTemplate;
            if (tag.injectedTemplate) {
               injectedTemplate = Process.processExpressions(
                  tag.injectedTemplate, data, this.fileName, undefined, preparedScope
               );
               return syncRequireTemplateOrControl(injectedTemplate,
                  FSC.getStr(preparedScope),
                  decor && decor.isMainAttrs
                     ? TClosure.genPlainMergeAttr('attr', FSC.getStr(decorAttribs))
                     : FSC.getStr(decorAttribs),
                  tag);
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
