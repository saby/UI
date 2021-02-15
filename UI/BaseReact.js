/**
 * Библиотека, который совпадает по API с UI/Base, но экспортит реактовский контрол вместо UI/Base:Control.
 * Написана именно на js, чтобы задать имя руками. За основу взят сгенерированный из ts код.
 * @author Зайцев А.С.
 */
// Разрываю имя, чтобы билдер не попытался упаковать это в пакет
// eslint-disable-next-line no-useless-concat, anonymous-component
define('UI/' + 'Base', [
   'require',
   'exports',
   'tslib',
   'UI/_react/Control/WasabyOverReact',
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
