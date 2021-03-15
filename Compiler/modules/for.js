define('Compiler/modules/for', [
   'Compiler/expressions/Process',
   'Compiler/codegen/templates',
   'Compiler/expressions/Statement'
], function(Process, templates, Statement) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var forM = {
      module: function forModule(tag, data) {
         var statelessTag;
         var fromAttr = tag.attribs.hasOwnProperty('for');
         statelessTag = {
            attribs: tag.attribs,
            children: tag.children,
            name: tag.name,
            type: tag.type
         };
         tag.key = tag.prefix ? tag.prefix + '-' + tag.key : tag.key;

         function resolveStatement2() {
            var START_FROM = tag.attribs.START_FROM.data[0]
               ? Process.processExpressions(tag.attribs.START_FROM.data[0], data, this.fileName)
               : '';
            var CUSTOM_CONDITION = tag.attribs.CUSTOM_CONDITION.data[0]
               ? Process.processExpressions(tag.attribs.CUSTOM_CONDITION.data[0], data, this.fileName)
               : '';
            var CUSTOM_ITERATOR = tag.attribs.CUSTOM_ITERATOR.data[0]
               ? Process.processExpressions(tag.attribs.CUSTOM_ITERATOR.data[0], data, this.fileName)
               : '';

            if (fromAttr) {
               tag.attribs.for = undefined;
            }
            tag.attribs.START_FROM = undefined;
            tag.attribs.CUSTOM_CONDITION = undefined;
            tag.attribs.CUSTOM_ITERATOR = undefined;

            var processed = this._process(fromAttr ? [statelessTag] : statelessTag.children, data);
            var cycleIndex = '\'_' + tag.__$ws_uniqueIndex + '\'';

            return templates.generateFor(START_FROM, CUSTOM_CONDITION, CUSTOM_ITERATOR, processed, cycleIndex);
         }

         function resolveStatement() {
            if (!tag.forSource) {
               return resolveStatement2.call(this);
            }

            var variableNode = new Statement.VariableNode(tag.forSource.main, false, undefined);
            var scopeArray = Process.processExpressions(variableNode, data, this.fileName);

            if (fromAttr) {
               tag.attribs.for = undefined;
            }

            var processed = this._process(fromAttr ? [statelessTag] : statelessTag.children, data);
            var cycleIndex = '\'_' + tag.__$ws_uniqueIndex + '\'';

            return templates.generateForeach(scopeArray, tag.forSource, processed, cycleIndex);
         }

         return function forModuleReturnable() {
            if (tag.children !== undefined) {
               return resolveStatement.call(this);
            }
            return undefined;
         };
      }
   };
   return forM;
});
