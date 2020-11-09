define('UI/_builder/Tmpl/modules/if', [
   'UI/_builder/Tmpl/expressions/_private/Process',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/codegen/Generator'
], function ifLoader(Process, ErrorHandlerLib, Generator) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

   /**
    * Retrieving value from tag constructions
    */
   function challenge(tag, property, isText, data) {
      var source, fromAttr, tagData;
      try {
         fromAttr = tag.attribs.hasOwnProperty(property);
         tagData = fromAttr ? tag.attribs[property].data : tag.attribs.data.data;
         if (!isText) {
            tagData[0].noEscape = true;
         }

         source = {
            fromAttr: fromAttr,
            value: isText ? tagData.value.trim() : Process.processExpressions(tagData[0], data, this.fileName)
         };
      } catch (err) {
         errorHandler.error(
            'Для директивы ws:if не указан атрибут data, содержащий выражение с условием',
            {
               fileName: this.fileName
            }
         );
      }
      return source;
   }

   function sourceTags(tag, data, source, decor) {
      if (tag.children !== undefined) {
         tag.skip = true;
         var processed = this._process(tag.children, data, decor);
         var elseExists = tag.next && tag.next.name === 'ws:else';
         return '((' + source.value + ') ? ([' + processed + '])' +
            (elseExists ? '' : ': ' + Generator.genCreateText() + '), \n');
      }
      tag.skip = false;
      return undefined;
   }

   function sourceTagsAttrib(tag, data, source, decor) {
      var savedData = tag.attribs.if, processed;
      tag.attribs.if = undefined;

      processed = this._process([tag], data, decor);
      tag.attribs.if = savedData;
      var elseExists = false;
      return '((' + source.value + ') ? ([' + processed + '])' +
         (elseExists ? '' : ': ' + Generator.genCreateText() + '), \n');
   }

   return {
      module: function ifModule(tag, data) {
         tag.key = tag.prefix ? tag.prefix + '-' + tag.key : tag.key;
         function resolveStatement(source, decor) {
            if (source.fromAttr) {
               // Обработка модуля if в атрибуте тега
               return sourceTagsAttrib.call(this, tag, data, source, decor);
            }

            // обработка тега ws:if
            return sourceTags.call(this, tag, data, source, decor);
         }
         return function ifModuleReturnable(decor) {
            if (tag.children !== undefined) {
               return resolveStatement.call(this, challenge.call(this, tag, 'if', false, data), decor);
            }
            return undefined;
         };
      }
   };
});
