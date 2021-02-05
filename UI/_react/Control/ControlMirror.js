/**
 * Модуль, который экспортит реактовский контрол вместо UI/_base/Control.
 * Написан именно на js, чтобы задать имя руками. За основу взят сгенерированный из ts код.
 * @author Зайцев А.С.
 */
define('UI/_base/Control', [
   'require',
   'exports',
   'tslib',
   'UI/_react/Control/Compatible'
], function(require, exports, tsLib, CompatibleControl) {
   'use strict';
   Object.defineProperty(exports, '__esModule', { value: true });
   exports.default = CompatibleControl.Control;
});
