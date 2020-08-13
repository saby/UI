define('UI/_builder/Tmpl/modules/template', [
   'UI/Utils',
   'UI/_builder/config',
   'UI/_builder/Tmpl/codegen/templates'
], function templateLoader(uiUtils, config, templates) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   function validateTemplateName(tag) {
      var name = tag.attribs.name;
      if (config.reservedWords.includes(name)) {
         uiUtils.Logger.templateError("Встречено разерверированное служебное слово '" + name + "' в названии шаблона", this.fileName);
      }
      if (!name.match(/^[a-zA-Z_]\w*$/g) && /\.wml$/g.test(this.fileName)) {
         uiUtils.Logger.templateError("Некорректное имя шаблона '" + name + "'", this.fileName);
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
