define('UI/_builder/Tmpl/modules/template', [
   'UI/BuilderConfig',
   'UI/_builder/Tmpl/codegen/templates'
], function templateLoader(BuilderConfig, templates) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   function validateTemplateName(tag) {
      var name = tag.attribs.name;
      if (BuilderConfig.Config.reservedWords.includes(name)) {
         this.errorHandler.error(
            "Встречено разерверированное служебное слово '" + name + "' в названии шаблона",
            {
               fileName: this.fileName
            }
         );
      }
      if (!name.match(/^[a-zA-Z_]\w*$/g) && /\.wml$/g.test(this.fileName)) {
         this.errorHandler.error(
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
         var name = validateTemplateName.call(this, tag);
         name = this.getFuncName(name);
         function templateReady() {
            var result, functionString;
            if (!this.includeStack[name]) {
               this.includeStack[name] = tag.children;
            }
            functionString = this.getString(this.includeStack[name], {}, this.handlers, {}, true);
            delete this.includeStack[name];
            if (this.includedFn) {
               functionString = templates.generatePrivateTemplate(functionString);
               this.includedFn[name] = functionString;
               return '';
            }
            result = templates.generatePrivateTemplateHeader(name, functionString);
            return result;
         }
         return templateReady;
      }
   };
   return templateM;
});
