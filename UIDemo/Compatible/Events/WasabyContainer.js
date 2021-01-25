define('UIDemo/Compatible/Events/WasabyContainer', [
    'UI/Base',
    'wml!UIDemo/Compatible/Events/WasabyContainer'
 ], function(UIBase, template) {
    'use strict';

    var ModuleClass = UIBase.Control.extend(
       {
          _template: template,
          value: "false"
       }
    );
    return ModuleClass;
 });
