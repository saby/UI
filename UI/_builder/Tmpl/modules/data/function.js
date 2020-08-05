define('View/Builder/Tmpl/modules/data/function', [
   'View/Builder/Tmpl/modules/data/utils/functionStringCreator',
   'View/Builder/Tmpl/modules/utils/parse'
], function(FSC, parseUtils) {
   'use strict';

   /**
    * Для обработки type="function" в конфигурации компонента
    *
    * @author Крылов М.А.
    */

   return function functionTag(injected) {
      return FSC.functionTypeHandler(
         this._processData.bind(this),
         injected.children,
         injected.attribs,
         parseUtils.parseAttributesForData
      );
   };
});
