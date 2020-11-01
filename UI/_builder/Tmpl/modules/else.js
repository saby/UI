define('UI/_builder/Tmpl/modules/else', [
   'UI/_builder/Tmpl/expressions/_private/Process',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/codegen/Generator'
], function elseLoader(Process, ErrorHandlerLib, Generator) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

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
               errorHandler.error(
                  'There is no "if" for "else" module to use',
                  {
                     fileName: this.fileName
                  }
               );
            }
            try {
               source = tag.prev.attribs.data.data[0].value;
            } catch (err) {
               errorHandler.error(
                  'There is no data for "else" module to use',
                  {
                     fileName: this.fileName
                  }
               );
            }
            if (tag.attribs !== undefined) {
               try {
                  tagExpressionBody = tag.attribs.data.data[0];
                  tagExpressionBody.noEscape = true;
                  elseSource = Process.processExpressions(tagExpressionBody, data, this.fileName);
                  tagExpressionBody.value = elseSource;
               } catch (err) {
                  errorHandler.error(
                     'There is no data for "else" module to use for excluding place "elseif"',
                     {
                        fileName: this.fileName
                     }
                  );
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
