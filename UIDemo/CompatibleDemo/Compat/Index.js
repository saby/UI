define('UIDemo/CompatibleDemo/Compat/Index', [
   'UI/Base',
   'wml!UIDemo/CompatibleDemo/Compat/Index',
   'Application/Initializer',
   'Application/Env',
   'Core/Deferred'
], function(UIBase, template, AppInit, AppEnv, Deferred) {
   'use strict';

   var ModuleClass = UIBase.Control.extend(
      {
         _template: template,
         _beforeMount: function() {
            try {
               /* TODO: set to presentation service */
               process.domain.req.compatible = true;
            } catch (e) {
            }
            this._title = this._getTitle();
            this._settigsController = {
               getSettings: function(ids) {
                  var storage = {};
                  storage[ids[0]] = 1000;
                  if (ids[0] === 'master111') {
                     storage[ids[0]] = 300;
                  }
                  return (new Deferred()).callback(storage);
               },
            };
         },
         _getTitle: function() {
            var location = this._getLocation();
            if (location) {
               var splitter = '%2F';
               var index = location.pathname.lastIndexOf(splitter);
               if (index > -1) {
                  var splittedName = location.pathname.slice(index + splitter.length)
                     .split('/');
                  var controlName = splittedName[0];
                  return this._replaceLastChar(controlName);
               }
            }
            return 'Wasaby Compatible';
         },
         _replaceLastChar: function(controlName) {
            if (controlName[controlName.length - 1] === '/') {
               return controlName.slice(0, -1);
            }
            return controlName;
         },
         _getLocation: function() {
            if (AppInit.isInit()) {
               return AppEnv.location;
            } if (typeof window !== 'undefined') {
               return window.location;
            }
            return null;
         },
         goHomeHandler: function() {
            window.location = "/UIDemo%2FCompatibleDemo%2FCompat%2FDemo";
         }
      }
   );

   return ModuleClass;
});
