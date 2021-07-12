define('Compiler/modules/template', [
   'Compiler/utils/ErrorHandler',
   'Compiler/Config',
   'Compiler/codegen/templates',
   'Compiler/codegen/feature/Function'
], function templateLoader(ErrorHandlerLib, BuilderConfig, templates, codegenFeatureFunction) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

   function validateTemplateName(tag) {
      var name = tag.attribs.name;
      if (BuilderConfig.Config.reservedWords.includes(name)) {
         errorHandler.error(
            "Встречено разерверированное служебное слово '" + name + "' в названии шаблона",
            {
               fileName: this.fileName
            }
         );
      }
      if (!name.match(/^[a-zA-Z_]\w*$/g) && /\.wml$/g.test(this.fileName)) {
         errorHandler.error(
            "Некорректное имя шаблона '" + name + "'",
            {
               fileName: this.fileName
            }
         );
      }
      return name;
   }

   var templateM = {
      module: function templateModule(tag) {
         // ws:template name already reserved
         var name = validateTemplateName.call(this, tag);
         function templateReady() {
            var result, functionString;
            functionString = this.getString(tag.children, {}, this.handlers, {}, true);
            if (this.includedFn) {
               functionString = templates.generatePrivateTemplate(functionString);
               this.includedFn[name] = functionString;
               return '';
            }
            var templateFunctionString = codegenFeatureFunction.createTemplateFunctionString(functionString);
            result = templates.generatePrivateTemplateHeader(name, templateFunctionString);
            return result;
         }
         return templateReady;
      }
   };
   return templateM;
});
