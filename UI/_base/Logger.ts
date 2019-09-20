/// <amd-module name="UI/_base/Logger" />

// @ts-ignore
import { IoC } from 'Env/Env';

function prepareStack (data: any): string {
      _polyfillRepeat();
      let message = '';
      let countIndent = 1;
      let nodeDom = data;
      let arrow = ' \u21B1 ';

      const excludeControls = {
         'Controls/event:Register': true,
         // todo 
      };

      do {
         let control = nodeDom.control;
         if (control) {
            let moduleName = control._moduleName;
            if (moduleName && !excludeControls[moduleName]) {
               message += '\n' + ' '.repeat(countIndent) + arrow + moduleName;
               countIndent += 1;
            }
         }
         nodeDom = nodeDom.parent;
      } while (nodeDom);

      return message;
}

/**
 * IE не поддерживает repeat
 * TODO задать вопрос о переносе к остальным полифилам
 * https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
 */
function _polyfillRepeat () {
   if (!String.prototype.repeat) {
      String.prototype.repeat = function(count) {
        'use strict';
        if (this == null) {
          throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        count = +count;
        if (count != count) {
          count = 0;
        }
        if (count < 0) {
          throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
          throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
          return '';
        }
        // Обеспечение того, что count является 31-битным целым числом, позволяет нам значительно
        // с оптимизировать главную часть функции. Впрочем, большинство современных (на август
        // 2014 года) браузеров не обрабатывают строки, длиннее 1 << 28 символов, так что:
        if (str.length * count >= 1 << 28) {
          throw new RangeError('repeat count must not overflow maximum string size');
        }
        var rpt = '';
        for (var i = 0; i < count; i++) {
          rpt += str;
        }
        return rpt;
      }
    }
}


function lifeCircleError (hookName:string, error:any, moduleName:string): any {
   error('LIFECYCLE ERROR. IN CONTROL ' + moduleName + '. HOOK NAME: ' + hookName, error, error);
};

function log (): any {
   const logger = IoC.resolve('ILogger');
   logger.log.apply(logger, arguments);
};

function error (): any {
   const logger = IoC.resolve('ILogger');
   logger.error.apply(logger, arguments);
};


export default {
   lifeCircleError,
   log,
   error
};