import {logError} from "./Common";
import {_FocusAttrs} from 'UI/Focus';

var global = (function() {
   return this || (0, eval)('this');
}());

function showAlertOnTimeoutInBrowser(err) {
   if (!err) { return false; }
   // @ts-ignore
   if (showAlertOnTimeoutInBrowser.isFired) { return false; }
   var REQUIRE_TIMEOUT_TYPE = 'timeout'
   if (err.requireType !== REQUIRE_TIMEOUT_TYPE) { return false; }
   if (typeof window === 'undefined') { return false; }
   if (global.wsConfig && global.wsConfig.showAlertOnTimeoutInBrowser === false) { return false; }
   var importantModules = err.requireModules.map(function (moduleName) {
      return moduleName.substr(0, 4) !== 'css!';
   });
   if (importantModules.length === 0) { return false; }
   alert('Произошла ошибка загрузки ресурса. Проверьте интернет соединение и повторите попытку.');
   // @ts-ignore
   showAlertOnTimeoutInBrowser.isFired = true;
   throw err;
}
function loadModule(name, file, load) {
   try {
      eval(file);
      requirejs(['wml!' + name], function(module) {
         module.__beforeMount = _FocusAttrs.prepareAttrsForFocus;
         load(module);
      }, function(err) {
         logError('Wml module loading error', err);
         load.error(err);
      });
   } catch(err) {
      logError('Wml module executing error', err);
      load.error(err);
   }
}
function createTemplate(name, html, tmpl, conf, load, ext) {
   try {
      if (!conf.fileName) {
         conf.fileName = name;
      }
      tmpl.getFile(html, conf, function (file) {
         loadModule(name, file, load);
      }, function (err) {
         err.message = 'Error while parsing template "' + name + '": ' + err.message;
         try {
            var timeoutAlert = showAlertOnTimeoutInBrowser(err);
            if (!timeoutAlert) {
               logError('Template', err);
            }
         } catch (err) {
            logError('Template', err);
         }
         load.error(err);
      }, ext);
   } catch (err) {
      err.message = 'Error while parsing template "' + name + '": ' + err.message;
      logError('Template', err);
      load.error(err);
   }
}

export {
   createTemplate,
   loadModule
}
