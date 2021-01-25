define('UIDemo/Compatible/Events/WasabyChild', [
    'UI/Base',
    'wml!UIDemo/Compatible/Events/WasabyChild'
 ], function(UIBase, template) {
    'use strict';

    var ModuleClass = UIBase.Control.extend(
       {
          _template: template,
          handler: function(e, key) {
             this._notify('myEvent', [], { bubbling: true });
          }
       }
    );
    return ModuleClass;
 });
