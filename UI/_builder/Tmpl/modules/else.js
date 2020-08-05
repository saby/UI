define('View/Builder/Tmpl/modules/else', [
   'View/Builder/Tmpl/expressions/_private/Process',
   'UI/Utils',
   'View/Builder/Tmpl/codegen/Generator'
], function elseLoader(Process, uiUtils, Generator) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   function capturingElse(tag, data, source, elseSource, decor) {
      var processed = this._process(tag.children, data, decor);
      if (elseSource) {
         var elseExists = tag.next && tag.next.name === 'ws:else';
         return ': (' + elseSource + ') ? ([' + processed + '])' +
            (elseExists ? '' : " : " + Generator.genCreateText() + "), \n");
      }
      return ' : ([' + processed + '])), \n';
   }

   return {
      module: function elseModule(tag, data) {
         var tagExpressionBody;
         tag.key = tag.prefix ? tag.prefix + '-' + tag.key : tag.key;
         function resolveStatement(decor) {
            var source, elseSource;
            if (tag.prev === undefined || (tag.prev.name !== 'ws:if' && tag.prev.name !== 'ws:else')) {
               uiUtils.Logger.templateError('There is no "if" for "else" module to use', this.fileName);
            }
            try {
               source = tag.prev.attribs.data.data[0].value;
            } catch (err) {
               uiUtils.Logger.templateError('There is no data for "else" module to use', this.fileName, null, err);
            }
            if (tag.attribs !== undefined) {
               try {
                  tagExpressionBody = tag.attribs.data.data[0];
                  tagExpressionBody.noEscape = true;
                  elseSource = Process.processExpressions(tagExpressionBody, data, this.fileName);
                  tagExpressionBody.value = elseSource;
               } catch (err) {
                  uiUtils.Logger.templateError('There is no data for "else" module to use for excluding place "elseif"', this.fileName, null, err);
               }
            }
            return capturingElse.call(this, tag, data, source, elseSource, decor);
         }
         return function elseModuleReturnable(decor) {
            if (tag.children !== undefined) {
               return resolveStatement.call(this, decor);
            }
            return undefined;
         };
      }
   };
});
