/**
 * Модуль, который экспортит реактовский контрол вместо UI/_base/Control.
 * Написан именно на js, чтобы задать имя руками. За основу взят сгенерированный из ts код.
 * @author Зайцев А.С.
 */
// Разрываю имя, чтобы билдер не попытался упаковать это в пакет
// eslint-disable-next-line no-useless-concat
define('UI/' + '_base/Control', [
   'require',
   'exports',
   'UI/_react/Control/WasabyOverReact'
], function(require, exports, CompatibleControl) {
   'use strict';
   Object.defineProperty(exports, '__esModule', { value: true });
   exports.default = CompatibleControl.Control;
});
