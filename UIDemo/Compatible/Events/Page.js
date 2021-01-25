define('UIDemo/Compatible/Events/Page', [
    'UI/Base',
    'wml!UIDemo/Compatible/Events/Page',
    'UIDemo/Compatible/Events/CompatibleParent'
 ], function(UIBase, template) {
    'use strict';

    var ModuleClass = UIBase.Control.extend(
       {
          _template: template
       }
    );
    return ModuleClass;
 });
