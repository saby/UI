/**
 * Библиотека, который совпадает по API с UI/Base, но экспортит реактовский контрол вместо UI/Base:Control.
 * Написана именно на js, чтобы задать имя руками. За основу взят сгенерированный из ts код.
 * @author Зайцев А.С.
 */
define('UI/Base', [
   'require',
   'exports',
   'tslib',
   'UI/_react/Control/Compatible',
   'UI/_base/CommonLib'
], function(require, exports, tsLib, CompatibleControl, CommonLib) {
   'use strict';
   Object.defineProperty(exports, '__esModule', { value: true });
   exports.Control = undefined;
   Object.defineProperty(exports, 'Control', {
      enumerable: true,
      get: function() {
         return CompatibleControl.Control;
      }
   });
   tsLib.__exportStar(CommonLib, exports);
});
